import {
  CHUNK_SIZE,
  TILE_MODEL_TAG,
  CHUNKS_PER_DIMENSION,
  WORLD_SIZE,
  ACTIONS_ADDRESS,
  TILE_REGISTRY,
} from '@/constants'
import { parseModel, getChunkAndLocalPosition, maskAddress } from '@/utils'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Vector3, TextureLoader, MeshBasicMaterial, SRGBColorSpace, ShaderMaterial } from 'three'
import { Chunk, Powerup, Tile as TileModel } from '@/models'
import { useAccount, useConnect, useProvider, useWaitForTransaction } from '@starknet-react/core'
import InstancedTiles from './InstancedTiles'
import { useFlipTile } from '@/hooks/useFlipTile'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import tileShader from '@/shaders/tile.shader'

export const RENDER_DISTANCE = 2 // Number of chunks to load in each direction

interface ChunksProps {
  entities: Record<string, TileModel>
  playFlipSound: () => void
  updateTile: (tile: TileModel) => () => void
}

export default function Chunks({ entities, playFlipSound, updateTile }: ChunksProps) {
  const [chunks, setChunks] = useState<Record<string, Chunk>>({})
  const { camera } = useThree()
  const lastCameraPosition = useRef<Vector3>(camera.position.clone())
  const { connect, connectors } = useConnect()
  const cartridgeConnector = connectors[0]

  const { account } = useAccount()
  const address = account?.address ? maskAddress(account?.address) : undefined
  const { provider } = useProvider()

  const updateVisibleChunks = useCallback(
    (cameraPosition: Vector3) => {
      const scaledPos = cameraPosition.clone().subScalar(cameraPosition.y)
      const worldY = Math.floor(scaledPos.z / (CHUNK_SIZE * 1.1))
      const worldX = Math.floor(scaledPos.x / (CHUNK_SIZE * 1.1))

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

  const textures = useMemo(() => {
    const loader = new TextureLoader()
    const loadTexture = (url: string) => {
      const tex = loader.load(url)
      tex.colorSpace = SRGBColorSpace
      return tex
    }

    return {
      robot: loadTexture(TILE_REGISTRY.robot.texture),
      orange: loadTexture(TILE_REGISTRY.orange.texture),
      green: loadTexture(TILE_REGISTRY.green.texture),
      red: loadTexture(TILE_REGISTRY.red.texture),
      blue: loadTexture(TILE_REGISTRY.blue.texture),
      pink: loadTexture(TILE_REGISTRY.pink.texture),
      purple: loadTexture(TILE_REGISTRY.purple.texture),
    }
  }, [])

  const robotMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        transparent: true,
        map: textures.robot,
      }),
    [textures.robot],
  )
  const material = useMemo(() => {
    const baseMaterial = new MeshBasicMaterial({
      transparent: true,
    })
    return new CustomShaderMaterial({
      baseMaterial,
      vertexShader: tileShader.vertex,
      fragmentShader: tileShader.fragment,
      uniforms: {
        robotTexture: { value: textures.robot },
        orangeTexture: { value: textures.orange },
        greenTexture: { value: textures.green },
        redTexture: { value: textures.red },
        blueTexture: { value: textures.blue },
        pinkTexture: { value: textures.pink },
        purpleTexture: { value: textures.purple },
      },
      transparent: true,
    })
  }, [textures])

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
            address: entities[entityKey]?.address ?? '0x0',
            powerup: entities[entityKey]?.powerup ?? Powerup.None,
            powerupValue: entities[entityKey]?.powerupValue ?? 0,
            team: entities[entityKey]?.team ?? 0,
          }
        })
      })
      return updatedChunks
    })
  }, [entities])

  const { flipTile } = useFlipTile({ updateTile, playFlipSound })

  return Object.entries(chunks).map(([chunkKey, chunk]) => (
    <group
      key={chunkKey}
      position={[chunk.worldX * (CHUNK_SIZE + CHUNK_SIZE / 10), 0, chunk.worldY * (CHUNK_SIZE + CHUNK_SIZE / 10)]}
    >
      <InstancedTiles
        tiles={chunk.tiles}
        material={material}
        robotMaterial={robotMaterial}
        onClick={(clickedTile) => {
          const globalX = chunk.x * CHUNK_SIZE + clickedTile.x
          const globalY = chunk.y * CHUNK_SIZE + clickedTile.y
          flipTile(globalX, globalY, 0)
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

      return {
        x: localX,
        y: localY,
        address: entities?.[`${globalX},${globalY}`]?.address ?? '0x0',
        powerup: entities?.[`${globalX},${globalY}`]?.powerup ?? Powerup.None,
        powerupValue: entities?.[`${globalX},${globalY}`]?.powerupValue ?? 0,
        team: entities?.[`${globalX},${globalY}`]?.team ?? 0,
      }
    }),
  }
}
