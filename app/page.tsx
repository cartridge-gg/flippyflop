'use client'

import {
  TORII_URL,
  TORII_RPC_URL,
  TORII_RELAY_URL,
  WORLD_ADDRESS,
  TILE_MODEL_TAG,
  CHUNK_SIZE,
  CHUNKS,
  WORLD_SIZE,
} from '@/constants'
import { Chunk, fetchChunk, initializeChunk, parseModel } from 'src/utils'
import { Entity } from 'dojo.c/pkg'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useAsync } from 'react-async-hook'
import { Tile as TileModel } from 'src/models'
import { TextureLoader, Vector3 } from 'three'
import { useLoader, useThree } from '@react-three/fiber'

const InstancedTiles = dynamic(() => import('@/components/canvas/InstancedTiles').then((mod) => mod.default), {
  ssr: false,
})
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

function getChunkAndLocalPosition(x: number, y: number) {
  const chunkX = Math.floor(x / CHUNK_SIZE)
  const chunkY = Math.floor(y / CHUNK_SIZE)
  const localX = x % CHUNK_SIZE
  const localY = y % CHUNK_SIZE
  const chunkIdx = chunkX * CHUNKS + chunkY
  const localIdx = localY * CHUNK_SIZE + localX
  return { chunkIdx, localIdx, chunkX, chunkY, localX, localY }
}

function Chunks() {
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
  const { camera } = useThree()
  const lastCameraPosition = useRef(new Vector3())

  const updateChunk = useCallback(
    async (x: number, y: number) => {
      if (!client.result) return

      const chunkIdx = x * CHUNKS + y
      // if (chunks[chunkIdx]) return // Skip if chunk is already loaded

      const entities = await fetchChunk(client.result, x, y)
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
    },
    [client.result],
  )

  useEffect(() => {
    updateChunk(0, 0)
  }, [updateChunk])

  // useEffect(() => {
  //   if (!client.result) return

  //   const checkCameraPosition = () => {
  //     if (camera.position.distanceTo(lastCameraPosition.current) > CHUNK_SIZE / 2) {
  //       const cameraChunkX = Math.floor(camera.position.x / CHUNK_SIZE)
  //       const cameraChunkY = Math.floor(camera.position.z / CHUNK_SIZE)

  //       // Load chunks in view
  //       for (let x = cameraChunkX - 1; x <= cameraChunkX + 1; x++) {
  //         for (let y = cameraChunkY - 1; y <= cameraChunkY + 1; y++) {
  //           if (x >= 0 && x < CHUNKS && y >= 0 && y < CHUNKS) {
  //             updateChunk(x, y)
  //           }
  //         }
  //       }

  //       lastCameraPosition.current.copy(camera.position)
  //     }
  //   }

  //   const interval = setInterval(checkCameraPosition, 1000) // Check every second

  //   return () => clearInterval(interval)
  // }, [client.result, camera])

  const frontTexture = useLoader(TextureLoader, '/textures/Robot_Black_2x_Rounded.png')
  const backTexture = useLoader(TextureLoader, '/textures/Smiley_Orange_2x_Rounded.png')

  return Object.entries(chunks).map(([chunkIdx, chunk]) => (
    <group key={chunkIdx} position={[chunk.x * CHUNK_SIZE, 0, chunk.y * CHUNK_SIZE]}>
      {/* <InstancedTiles
        key={chunkIdx}
        tiles={chunk.tiles}
        frontTexture={frontTexture}
        backTexture={backTexture}
        onClick={(clickedTile) => {
          const localX = clickedTile.x % CHUNK_SIZE
          const localY = Math.floor(clickedTile.y / CHUNK_SIZE)
          const { chunkIdx, localIdx } = getChunkAndLocalPosition(
            chunk.x * CHUNK_SIZE + localX,
            chunk.y * CHUNK_SIZE + localY,
          )
          setChunks((prevChunks) => {
            const updatedChunks = { ...prevChunks }
            updatedChunks[chunkIdx].tiles[localIdx] = {
              ...updatedChunks[chunkIdx].tiles[localIdx],
              flipped: clickedTile.flipped === '0x0' ? '0x1' : '0x0',
            }
            return updatedChunks
          })
        }}
      /> */}
      {chunk.tiles.map((tile, idx) => {
        const localX = idx % CHUNK_SIZE
        const localY = Math.floor(idx / CHUNK_SIZE)
        return (
          <Tile
            key={`${localX}-${localY}`}
            tile={{
              ...tile,
              x: localX,
              y: localY,
            }}
            frontTexture={frontTexture}
            backTexture={backTexture}
            onClick={(clickedTile) => {
              const { chunkIdx, localIdx } = getChunkAndLocalPosition(
                chunk.x * CHUNK_SIZE + localX,
                chunk.y * CHUNK_SIZE + localY,
              )
              setChunks((prevChunks) => {
                const updatedChunks = { ...prevChunks }
                updatedChunks[chunkIdx].tiles[localIdx] = {
                  ...updatedChunks[chunkIdx].tiles[localIdx],
                  flipped: clickedTile.flipped === '0x0' ? '0x1' : '0x0',
                }
                return updatedChunks
              })
            }}
          />
        )
      })}
    </group>
  ))
}

export default function Page() {
  return (
    <>
      <View className='flex h-screen w-full flex-col items-center justify-center'>
        <Suspense fallback={null}>
          <Chunks />
          <Common color='#737782' />
        </Suspense>
      </View>
    </>
  )
}
