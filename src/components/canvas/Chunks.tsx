import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { TextureLoader, MeshBasicMaterial, SRGBColorSpace } from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

import InstancedTiles from './InstancedTiles'
import { CHUNK_SIZE, CHUNKS_PER_DIMENSION, TILE_REGISTRY } from '@/constants'
import { useFlipTile } from '@/hooks/useFlipTile'
import { Powerup } from '@/models'
import tileShader from '@/shaders/tile.shader'

import type { Chunk, Tile as TileModel } from '@/models'
import type { Vector3 } from 'three'

export const RENDER_DISTANCE = 2 // Number of chunks to load in each direction

interface ChunksProps {
  entities: Record<string, TileModel>
  playFlipSound: () => void
  updateTile: (tile: TileModel) => () => void
  selectedTeam: number
  timeRange: [number, number]
  isLoading: boolean
}

export default function Chunks({
  entities,
  playFlipSound,
  updateTile,
  selectedTeam,
  timeRange,
  isLoading,
}: ChunksProps) {
  const [chunks, setChunks] = useState<Record<string, Chunk>>({})
  const { flipTile } = useFlipTile({ updateTile, playFlipSound, timeRange, isLoading })
  const { camera } = useThree()
  const lastCameraPosition = useRef<Vector3>(camera.position.clone())

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
      textureAtlas: loadTexture('/textures/Flippyflop_Textures.png'),
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
        textureAtlas: { value: textures.textureAtlas },
        time: { value: 0 },
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

  return Object.entries(chunks).map(([chunkKey, chunk]) => (
    <InstancedTiles
      key={chunkKey}
      position={[chunk.worldX * CHUNK_SIZE * 1.1, 0, chunk.worldY * CHUNK_SIZE * 1.1]}
      tiles={chunk.tiles}
      material={material}
      robotMaterial={robotMaterial}
      onClick={(clickedTile) => {
        const globalX = chunk.x * CHUNK_SIZE + clickedTile.x
        const globalY = chunk.y * CHUNK_SIZE + clickedTile.y
        flipTile(globalX, globalY, selectedTeam)
      }}
    />
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
