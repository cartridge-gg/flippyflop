import { CHUNK_SIZE, TILE_MODEL_TAG, CHUNKS_PER_DIMENSION, WORLD_SIZE, ACTIONS_ADDRESS } from '@/constants'
import { parseModel, getChunkAndLocalPosition } from '@/utils'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Vector3, TextureLoader, MeshBasicMaterial, SRGBColorSpace } from 'three'
import { Chunk, Tile as TileModel } from '@/models'
import { useAccount, useConnect, useProvider, useWaitForTransaction } from '@starknet-react/core'
import InstancedTiles from './InstancedTiles'

export const RENDER_DISTANCE = 2 // Number of chunks to load in each direction

interface ChunksProps {
  entities: Record<string, TileModel>
  playFlipSound: () => void
}

export default function Chunks({ entities, playFlipSound }: ChunksProps) {
  const [chunks, setChunks] = useState<Record<string, Chunk>>({})
  const { camera } = useThree()
  const lastCameraPosition = useRef<Vector3>(camera.position.clone())
  const { connect, connectors } = useConnect()
  const cartridgeConnector = connectors[0]

  const { account } = useAccount()
  const { provider } = useProvider()

  const updateVisibleChunks = useCallback(
    (cameraPosition: Vector3) => {
      const scaledPos = cameraPosition.clone().subScalar(cameraPosition.y)
      const worldX = Math.floor(scaledPos.x / CHUNK_SIZE)
      const worldY = Math.floor(scaledPos.z / CHUNK_SIZE)

      setChunks((prevChunks) => {
        const newChunks: Record<string, Chunk> = {}

        for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
          for (let dy = -RENDER_DISTANCE; dy <= RENDER_DISTANCE; dy++) {
            const chunkWorldX = worldX + dx
            const chunkWorldY = worldY + dy
            const chunkKey = `${chunkWorldX},${chunkWorldY}`

            if (prevChunks[chunkKey]) {
              newChunks[chunkKey] = prevChunks[chunkKey]
            } else {
              newChunks[chunkKey] = createNewChunk(chunkWorldX, chunkWorldY, entities)
            }
          }
        }

        return newChunks
      })
    },
    [entities],
  )

  useEffect(() => {
    updateVisibleChunks(camera.position)
  }, [camera.position, updateVisibleChunks])

  useFrame(() => {
    if (camera.position.distanceToSquared(lastCameraPosition.current) >= 10) {
      updateVisibleChunks(camera.position)
      lastCameraPosition.current = camera.position.clone()
    }
  })

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

  // Add this useEffect to update chunks when entities change
  useEffect(() => {
    setChunks((prevChunks) => {
      const updatedChunks = { ...prevChunks }
      Object.entries(updatedChunks).forEach(([chunkKey, chunk]) => {
        chunk.tiles = chunk.tiles.map((tile, idx) => {
          const localX = idx % CHUNK_SIZE
          const localY = Math.floor(idx / CHUNK_SIZE)
          const globalX = chunk.x * CHUNK_SIZE + localX
          const globalY = chunk.y * CHUNK_SIZE + localY
          const entityKey = `${globalX},${globalY}`
          return {
            ...tile,
            flipped: entities[entityKey]?.flipped ?? '0x0',
          }
        })
      })
      return updatedChunks
    })
  }, [entities])

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
          if (!account) {
            connect({
              connector: cartridgeConnector,
            })
            return false
          }

          setChunks((prevChunks) => {
            const chunkKey = `${chunk.worldX},${chunk.worldY}`
            if (!prevChunks[chunkKey]) return prevChunks

            const tiles = [...prevChunks[chunkKey].tiles]
            tiles[clickedTile.y * CHUNK_SIZE + clickedTile.x] = {
              x: clickedTile.x,
              y: clickedTile.y,
              flipped: account.address,
            }
            prevChunks[chunkKey].tiles = tiles

            return { ...prevChunks }
          })

          playFlipSound()

          setTimeout(async () => {
            const tx = await account.execute([
              {
                contractAddress: ACTIONS_ADDRESS,
                entrypoint: 'flip',
                calldata: [
                  '0x' + (chunk.x * CHUNK_SIZE + clickedTile.x).toString(16),
                  '0x' + (chunk.y * CHUNK_SIZE + clickedTile.y).toString(16),
                ],
              },
            ])

            const flipped = await provider.waitForTransaction(tx.transaction_hash)
            if (!flipped.isSuccess()) {
              setChunks((prevChunks) => {
                const chunkKey = `${chunk.worldX},${chunk.worldY}`
                if (!prevChunks[chunkKey]) return prevChunks

                const tiles = [...prevChunks[chunkKey].tiles]
                tiles[clickedTile.y * CHUNK_SIZE + clickedTile.x] = {
                  x: clickedTile.x,
                  y: clickedTile.y,
                  flipped: '0x0',
                }
                prevChunks[chunkKey].tiles = tiles

                return { ...prevChunks }
              })
            }
          })

          return true
        }}
      />
    </group>
  ))
}

function createNewChunk(worldX: number, worldY: number, entities: Record<string, TileModel>): Chunk {
  return {
    x: ((worldX % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION,
    y: ((worldY % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION,
    worldX,
    worldY,
    tiles: Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }).map((_, idx) => {
      const localX = idx % CHUNK_SIZE
      const localY = Math.floor(idx / CHUNK_SIZE)
      const globalX =
        (((worldX % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION) * CHUNK_SIZE + localX
      const globalY =
        (((worldY % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION) * CHUNK_SIZE + localY
      return { x: localX, y: localY, flipped: entities?.[`${globalX},${globalY}`]?.flipped ?? '0x0' }
    }),
  }
}
