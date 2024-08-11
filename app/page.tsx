'use client'

import {
  TORII_URL,
  TORII_RPC_URL,
  TORII_RELAY_URL,
  WORLD_ADDRESS,
  TILE_MODEL_TAG,
  CHUNK_SIZE,
  CHUNKS,
} from '@/constants'
import { Chunk, initializeChunk, parseModel } from 'src/utils'
import { Entity } from 'dojo.c/pkg'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Tile as TileModel } from 'src/models'
import { TextureLoader } from 'three'
import { useLoader } from '@react-three/fiber'
import BorderTiles from '@/components/canvas/BorderTiles'

const Tile = dynamic(() => import('@/components/canvas/Tile').then((mod) => mod.default), { ssr: false })
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 size-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

const WORLD_SIZE = 100

function getChunkAndLocalPosition(x: number, y: number) {
  const chunkX = Math.floor(x / CHUNK_SIZE)
  const chunkY = Math.floor(y / CHUNK_SIZE)
  const localX = x % CHUNK_SIZE
  const localY = y % CHUNK_SIZE
  const chunkIdx = chunkX * CHUNKS + chunkY
  const localIdx = localY * CHUNK_SIZE + localX
  return { chunkIdx, localIdx, chunkX, chunkY, localX, localY }
}

export default function Page() {
  const wasmRuntime = useAsync(async () => import('dojo.c/pkg'), [])

  const client = useAsync(async () => {
    return await wasmRuntime.result.createClient({
      toriiUrl: TORII_URL,
      rpcUrl: TORII_RPC_URL,
      relayUrl: TORII_RELAY_URL,
      worldAddress: WORLD_ADDRESS,
    })
  }, [wasmRuntime.result])

  const [chunks, setChunks] = useState<Record<number, Chunk>>({
    0: initializeChunk(0, 0),
  })

  const subscription = useAsync(
    async () =>
      client.result.onEntityUpdated(
        [
          {
            Keys: {
              keys: [],
              pattern_matching: 'VariableLen',
              models: [TILE_MODEL_TAG],
            },
          },
        ],
        (_hashed_keys: string, entity: Entity) => {
          const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
          const { chunkIdx, localIdx, chunkX, chunkY, localX, localY } = getChunkAndLocalPosition(
            parsedModel.x,
            parsedModel.y,
          )

          setChunks((prevChunks) => {
            const updatedChunks = { ...prevChunks }
            if (!updatedChunks[chunkIdx]) {
              updatedChunks[chunkIdx] = initializeChunk(chunkX, chunkY)
            }
            updatedChunks[chunkIdx].tiles[localIdx] = {
              ...parsedModel,
              x: localX,
              y: localY,
            }
            return updatedChunks
          })
        },
      ),
    [client.result],
  )

  const fetchChunk = async (x: number, y: number) => {
    if (!client.result) return

    const chunkIdx = x * CHUNKS + y
    const entities = await client.result.getEntities({
      clause: {
        Composite: {
          clauses: [
            {
              Member: {
                member: 'x',
                model: TILE_MODEL_TAG,
                operator: 'Gte',
                value: { U32: x * CHUNK_SIZE },
              },
            },
            {
              Member: {
                member: 'x',
                model: TILE_MODEL_TAG,
                operator: 'Lt',
                value: { U32: (x + 1) * CHUNK_SIZE },
              },
            },
            {
              Member: {
                member: 'y',
                model: TILE_MODEL_TAG,
                operator: 'Gte',
                value: { U32: y * CHUNK_SIZE },
              },
            },
            {
              Member: {
                member: 'y',
                model: TILE_MODEL_TAG,
                operator: 'Lt',
                value: { U32: (y + 1) * CHUNK_SIZE },
              },
            },
          ],
          operator: 'And',
        },
      },
      limit: CHUNK_SIZE * CHUNK_SIZE,
      offset: 0,
    })

    setChunks((prevChunks) => {
      const newChunk: Chunk = {
        x,
        y,
        tiles: Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }).map((_, idx) => {
          const localX = idx % CHUNK_SIZE
          const localY = Math.floor(idx / CHUNK_SIZE)
          const globalX = x * CHUNK_SIZE + localX
          const globalY = y * CHUNK_SIZE + localY
          const tile = Object.values(entities).find((entity) => {
            const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
            return parsedModel.x === globalX && parsedModel.y === globalY
          })
          return tile
            ? { ...parseModel<TileModel>(tile[TILE_MODEL_TAG]), x: localX, y: localY }
            : { x: localX, y: localY, flipped: '0x0' }
        }),
      }
      return { ...prevChunks, [chunkIdx]: newChunk }
    })
  }

  useEffect(() => {
    if (!client.result) return
    fetchChunk(0, 0)
  }, [client.result])

  const frontTexture = useLoader(TextureLoader, '/textures/Robot_Black_2x_Rounded.png')
  const backTexture = useLoader(TextureLoader, '/textures/Smiley_Orange_2x_Rounded.png')

  return (
    <>
      <View orbit className='flex h-screen w-full flex-col items-center justify-center'>
        <Suspense fallback={null}>
          {Object.entries(chunks).map(([chunkIdx, chunk]) => (
            <group key={chunkIdx} position={[chunk.x * CHUNK_SIZE, 0, chunk.y * CHUNK_SIZE]}>
              {chunk.tiles.map((tile, idx) => (
                <Tile
                  key={`${tile.x}-${tile.y}`}
                  tile={{
                    ...tile,
                    x: chunk.x * CHUNK_SIZE + tile.x,
                    y: chunk.y * CHUNK_SIZE + tile.y,
                  }}
                  frontTexture={frontTexture}
                  backTexture={backTexture}
                  onClick={(clickedTile) => {
                    const { chunkIdx, localIdx } = getChunkAndLocalPosition(clickedTile.x, clickedTile.y)
                    setChunks((prevChunks) => {
                      const updatedChunks = { ...prevChunks }
                      updatedChunks[chunkIdx].tiles[localIdx] = {
                        ...updatedChunks[chunkIdx].tiles[localIdx],
                        flipped: '0x1',
                      }
                      return updatedChunks
                    })
                  }}
                />
              ))}
            </group>
          ))}
          {/* <BorderTiles frontTexture={frontTexture} backTexture={backTexture} /> */}
          <Common color='#737782' />
        </Suspense>
      </View>
    </>
  )
}
