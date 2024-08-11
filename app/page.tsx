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
import { Chunk, initializeChunk, initializeTiles, parseModel } from 'src/utils'
import { Entities, Entity } from 'dojo.c/pkg'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { Tile as TileModel } from 'src/models'
import { BigNumberish } from 'starknet'
import { TextureLoader, Vector2 } from 'three'
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

  // chunkIdx: TileModel[]
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
          console.log(_hashed_keys)
          const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
          setChunks((chunks) => {
            const idx = parsedModel.x * CHUNK_SIZE + parsedModel.y
            const chunkIdx = Math.floor(parsedModel.x / CHUNK_SIZE) * CHUNKS + Math.floor(parsedModel.y / CHUNK_SIZE)
            const chunk = chunks?.[chunkIdx]
            if (!chunk) return { ...chunks }
            chunk.tiles[idx % CHUNK_SIZE] = parsedModel
            return { ...chunks }
          })
        },
      ),
    [client.result],
  )

  const fetchChunk = async (x: number, y: number) => {
    if (!client.result) return

    const chunkIdx = x * CHUNK_SIZE + y
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

    setChunks((chunks) => {
      // Object.values(entities).forEach((entity) => {
      //   const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
      //   const localX = parsedModel.x % CHUNK_SIZE
      //   const localY = parsedModel.y % CHUNK_SIZE
      //   chunks[chunkIdx].tiles[localX * CHUNK_SIZE + localY] = parsedModel
      // })

      chunks[chunkIdx] = {
        x,
        y,
        tiles: Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }).map((_, idx) => {
          const tile = Object.values(entities).find((entity) => {
            const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
            const localX = Math.floor(idx / CHUNK_SIZE)
            const localY = idx % CHUNK_SIZE
            return parsedModel.x === x + localX && parsedModel.y === y + localY
          })
          return tile
            ? parseModel<TileModel>(tile[TILE_MODEL_TAG])
            : { x: x + Math.floor(idx / CHUNK_SIZE), y: y + (idx % CHUNK_SIZE), flipped: '0x0' }
        }),
      }
      return { ...chunks }
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
          {Object.values(chunks).map((chunk) =>
            chunk.tiles.map((tile) => (
              <Tile
                key={`${tile.x}-${tile.y}`}
                tile={tile}
                frontTexture={frontTexture}
                backTexture={backTexture}
                onClick={(tile) =>
                  setChunks((chunks) => {
                    const idx = tile.x * CHUNK_SIZE + tile.y
                    chunks[chunk.x * CHUNK_SIZE + chunk.y].tiles[idx] = {
                      x: tile.x,
                      y: tile.y,
                      flipped: '0x1',
                    }
                    return { ...chunks }
                  })
                }
              />
            )),
          )}
          {/* <BorderTiles frontTexture={frontTexture} backTexture={backTexture} /> */}

          {/* {Object.entries(tiles[currentChunkIdx]).map(([key, tile]) => (
              <Tile
                key={key}
                tile={tile}
                currentChunk={currentChunk}
                onClick={(x, y) =>
                  setTiles((tiles) => {
                    const idx = x * CHUNK_SIZE + y
                    tiles[currentChunkIdx][idx] = { x, y, flipped: '0x1' }
                    return { ...tiles }
                  })
                }
              />
            ))} */}
          {/* <TileInstances
            tiles={tiles}
            onClick={(x, y) =>
              setTiles((tiles) => {
                const idx = x * CHUNK_SIZE + y
                tiles[idx] = { x, y, flipped: '0x1' }
                return Array.from(tiles)
              })
            }
          /> */}
          <Common color='#737782' />
        </Suspense>
      </View>
    </>
  )
}
