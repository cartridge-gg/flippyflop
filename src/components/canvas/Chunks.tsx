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
  ACTIONS_ADDRESS,
} from '@/constants'
import { initializeChunk, fetchChunk, parseModel, getChunkAndLocalPosition, generateUserTypedData } from '@/utils'
import { useThree, useLoader, useFrame } from '@react-three/fiber'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import {
  Vector3,
  TextureLoader,
  MeshBasicMaterial,
  MeshStandardMaterial,
  LinearSRGBColorSpace,
  SRGBColorSpace,
} from 'three'
import { Chunk, Tile as TileModel } from '@/models'
import dynamic from 'next/dynamic'
import { Entity } from 'dojo.c/pkg'

const ChatInput = dynamic(() => import('@/components/canvas/ChatInput').then((mod) => mod.default), { ssr: false })
const Cursor = dynamic(() => import('@/components/canvas/Cursor').then((mod) => mod.default), { ssr: false })
const InstancedTiles = dynamic(() => import('@/components/canvas/InstancedTiles').then((mod) => mod.default), {
  ssr: false,
})
const Tile = dynamic(() => import('@/components/canvas/Tile').then((mod) => mod.default), { ssr: false })

const RENDER_DISTANCE = 1 // Number of chunks to load in each direction

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

  const provider = useAsync(async () => {
    return await wasmRuntime.result.createProvider(TORII_RPC_URL)
  }, [wasmRuntime.result])

  const account = useAsync(async () => {
    if (!provider.result) return
    return await provider.result.createAccount(
      '0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a',
      '0xb3ff441a68610b30fd5e2abbf3a1548eb6ba6f3559f2862bf2dc757e5828ca',
    )
  }, [provider.result])

  const [chunks, setChunks] = useState<Record<string, Chunk>>({})
  const { camera } = useThree()
  const [cameraChunk, setCameraChunk] = useState({ x: 0, y: 0, worldX: 0, worldY: 0 })
  const lastCameraPosition = useRef<Vector3>(camera.position.clone())
  const [userCursors, setUserCursors] = useState<
    Record<string, { message: string; x: number; y: number; chunkKey: string }>
  >({})

  

  const updateChunk = useCallback(
    async (x: number, y: number, worldX: number, worldY: number) => {
      if (!client.result) return

      const chunkKey = `${worldX},${worldY}`

      const entities = await fetchChunk(client.result, x, y)
      setChunks((prevChunks) => {
        const newChunk: Chunk = {
          x,
          y,
          worldX,
          worldY,
          tiles: Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }).map((_, idx) => {
            const localX = idx % CHUNK_SIZE
            const localY = Math.floor(idx / CHUNK_SIZE)
            const globalX = worldX * CHUNK_SIZE + localX
            const globalY = worldY * CHUNK_SIZE + localY
            const tile = Object.values(entities).find((entity) => {
              const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
              return parsedModel.x === globalX && parsedModel.y === globalY
            })
            return tile
              ? { ...parseModel<TileModel>(tile[TILE_MODEL_TAG]), x: localX, y: localY }
              : { x: localX, y: localY, flipped: '0x0' }
          }),
        }
        return { ...prevChunks, [chunkKey]: newChunk }
      })
    },
    [client],
  )

  const loadNeighboringChunks = useCallback(
    (centerX: number, centerY: number) => {
      for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
        for (let dy = -RENDER_DISTANCE; dy <= RENDER_DISTANCE; dy++) {
          const worldX = centerX + dx
          const worldY = centerY + dy
          const x = ((worldX % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION
          const y = ((worldY % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION
          const chunkKey = `${worldX},${worldY}`
          if (!chunks[chunkKey]) {
            updateChunk(x, y, worldX, worldY)
          }
        }
      }
    },
    [chunks, updateChunk],
  )

  const unloadDistantChunks = useCallback((centerX: number, centerY: number) => {
    setChunks((prevChunks) => {
      const newChunks = { ...prevChunks }
      Object.entries(newChunks).forEach(([key, chunk]) => {
        const [chunkWorldX, chunkWorldY] = key.split(',').map(Number)
        const distance = Math.max(Math.abs(chunkWorldX - centerX), Math.abs(chunkWorldY - centerY))
        if (distance > RENDER_DISTANCE + 1) {
          delete newChunks[key]
        }
      })
      return newChunks
    })
  }, [])

  useFrame(() => {
    if (camera.position.distanceTo(lastCameraPosition.current) < CHUNK_SIZE * 0.1) return
    const scaledPos = camera.position.clone().subScalar(50)
    const worldX = Math.floor(scaledPos.x / CHUNK_SIZE)
    const worldY = Math.floor(scaledPos.z / CHUNK_SIZE)
    const x = ((worldX % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION
    const y = ((worldY % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION

    setCameraChunk({ x, y, worldX, worldY })
    loadNeighboringChunks(worldX, worldY)
    unloadDistantChunks(worldX, worldY)

    lastCameraPosition.current = camera.position.clone()
  })

  useEffect(() => {
    if (!client.result) return
    loadNeighboringChunks(cameraChunk.worldX, cameraChunk.worldY)
  }, [loadNeighboringChunks, cameraChunk, client.result])

  const topTexture = useMemo(() => {
    const texture = new TextureLoader().load('/textures/Robot_Black_2x_Rounded.png')
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [])
  const bottomTexture = useMemo(() => {
    const texture = new TextureLoader().load('/textures/Smiley_Orange_2x_Rounded.png')
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [])

  const topMaterial = useMemo(() => new MeshBasicMaterial({ map: topTexture, transparent: true }), [topTexture])
  const bottomMaterial = useMemo(
    () => new MeshBasicMaterial({ map: bottomTexture, transparent: true }),
    [bottomTexture],
  )

  return Object.entries(chunks).map(([chunkKey, chunk]) => (
    <group
      key={chunkKey}
      position={[chunk.worldX * (CHUNK_SIZE + CHUNK_SIZE / 10), 0, chunk.worldY * (CHUNK_SIZE + CHUNK_SIZE / 10)]}
    >
      <InstancedTiles
        tiles={chunk.tiles}
        topMaterial={topMaterial}
        bottomMaterial={bottomMaterial}
        onClick={(clickedTile) => {
          setChunks((prevChunks) => {
            const chunkKey = `${chunk.worldX},${chunk.worldY}`
            if (!prevChunks[chunkKey]) return prevChunks

            const tiles = [...prevChunks[chunkKey].tiles]
            tiles[clickedTile.y * CHUNK_SIZE + clickedTile.x] = {
              x: clickedTile.x,
              y: clickedTile.y,
              flipped: account.result.address(),
            }
            prevChunks[chunkKey].tiles = tiles

            return { ...prevChunks }
          })
        }}
      />
      {/* {Object.entries(userCursors).map(([identity, { x, y, chunkKey: cursorChunk, message }]) => {
        if (cursorChunk !== chunkKey) return null
        // if (identity === account.result?.address()) return null

        return <Cursor key={identity} position={{ x, y }} identity={identity} />
      })} */}

      {/* {chunk.tiles.map((tile, idx) => {
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
            topMaterial={topMaterial}
            bottomMaterial={bottomMaterial}
            onHover={async (hoveredTile) => {
              if (!account.result) return
              // const typedData = JSON.stringify(
              //   generateUserTypedData(account.result.address(), chunk.x, chunk.y, localX, localY),
              // )
              // const hash = wasmRuntime.result.typedDataEncode(typedData, account.result.address())

              // // client.result.publishMessage(
              // //   typedData,
              // //   wasmRuntime.result.signingKeySign(
              // //     '0x2bbf4f9fd0bbb2e60b0316c1fe0b76cf7a4d0198bd493ced9b8df2a3a24d68a',
              // //     hash,
              // //   ),
              // // )
            }}
            onClick={async (clickedTile) => {
              if (!account.result) return

              // await account.result.executeRaw([
              //   {
              //     to: ACTIONS_ADDRESS,
              //     selector: 'flip',
              //     calldata: [
              //       '0x' + (chunk.x * CHUNK_SIZE + localX).toString(16),
              //       '0x' + (chunk.y * CHUNK_SIZE + localY).toString(16),
              //     ],
              //   },
              // ])
              setChunks((prevChunks) => {
                const chunkKey = `${chunk.worldX},${chunk.worldY}`
                if (!prevChunks[chunkKey]) return prevChunks

                prevChunks[chunkKey].tiles[idx] = {
                  x: localX,
                  y: localY,
                  flipped: account.result.address(),
                }
                return { ...prevChunks }
              })
            }}
          />
        )
      })} */}
    </group>
  ))
}
