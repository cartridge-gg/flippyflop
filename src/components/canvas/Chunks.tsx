import {
  TORII_URL,
  TORII_RPC_URL,
  TORII_RELAY_URL,
  WORLD_ADDRESS,
  CHUNKS,
  CHUNK_SIZE,
  TILE_MODEL_TAG,
  CHUNKS_PER_DIMENSION,
  WORLD_SIZE,
} from '@/constants'
import { initializeChunk, fetchChunk, parseModel, getChunkAndLocalPosition } from '@/utils'
import { useThree, useLoader, useFrame } from '@react-three/fiber'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { Vector3, TextureLoader } from 'three'
import { Chunk, Tile as TileModel } from '@/models'
import dynamic from 'next/dynamic'

const Tile = dynamic(() => import('@/components/canvas/Tile').then((mod) => mod.default), { ssr: false })

export default function Chunks() {
  const wasmRuntime = useAsync(async () => import('dojo.c/pkg'), [])
  const client = useAsync(async () => {
    return await wasmRuntime.result.createClient({
      toriiUrl: TORII_URL,
      rpcUrl: TORII_RPC_URL,
      relayUrl: TORII_RELAY_URL,
      worldAddress: WORLD_ADDRESS,
    })
  }, [wasmRuntime.result])

  const [chunks, setChunks] = useState<Record<number, Chunk>>({})
  const { camera } = useThree()
  const [cameraChunk, setCameraChunk] = useState({ x: 0, y: 0 })
  const lastCameraPosition = useRef<Vector3>(camera.position.clone())

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

  useFrame(() => {
    if (camera.position.distanceTo(lastCameraPosition.current) < CHUNK_SIZE * 1.5) return
    const scaledPos = camera.position.clone().subScalar(50)
    const x =
      (Math.floor(scaledPos.x / CHUNK_SIZE) % CHUNKS_PER_DIMENSION) + (scaledPos.x < 0 ? CHUNKS_PER_DIMENSION : 0)
    const y =
      (Math.floor(scaledPos.z / CHUNK_SIZE) % CHUNKS_PER_DIMENSION) + (scaledPos.z < 0 ? CHUNKS_PER_DIMENSION : 0)

    setCameraChunk({ x, y })

    lastCameraPosition.current = camera.position.clone()
  })

  useEffect(() => {
    if (chunks[cameraChunk.x * CHUNKS + cameraChunk.y]) return

    setChunks((prevChunks) => {
      const updatedChunks = { ...prevChunks }
      updatedChunks[cameraChunk.x * CHUNKS + cameraChunk.y] = initializeChunk(cameraChunk.x, cameraChunk.y)
      updateChunk(cameraChunk.x, cameraChunk.y)
      return updatedChunks
    })
  }, [updateChunk, cameraChunk, chunks])

  const frontTexture = useLoader(TextureLoader, '/textures/Robot_Black_2x_Rounded.png')
  const backTexture = useLoader(TextureLoader, '/textures/Smiley_Orange_2x_Rounded.png')

  return Object.entries(chunks).map(([chunkIdx, chunk]) => (
    <group key={chunkIdx} position={[chunk.x * (CHUNK_SIZE + 1), 0, chunk.y * (CHUNK_SIZE + 1)]}>
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
