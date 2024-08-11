import { BORDER_RENDER_THRESHOLD, BORDER_TILE_COUNT, WORLD_SIZE } from '@/constants'
import { Tile as TileModel } from '@/models'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useMemo } from 'react'
import { Vector3 } from 'three'
import Tile from './Tile'

function generateBorderTiles() {
  const borderTiles: TileModel[] = []

  for (let i = 0; i < BORDER_TILE_COUNT; i++) {
    // Top border
    borderTiles.push({ x: i * (WORLD_SIZE / (BORDER_TILE_COUNT - 1)), y: 0, flipped: '0x0' })
    // Bottom border
    borderTiles.push({ x: i * (WORLD_SIZE / (BORDER_TILE_COUNT - 1)), y: WORLD_SIZE, flipped: '0x0' })
    // Left border
    borderTiles.push({ x: 0, y: i * (WORLD_SIZE / (BORDER_TILE_COUNT - 1)), flipped: '0x0' })
    // Right border
    borderTiles.push({ x: WORLD_SIZE, y: i * (WORLD_SIZE / (BORDER_TILE_COUNT - 1)), flipped: '0x0' })
  }

  return borderTiles
}

export default function BorderTiles({ frontTexture, backTexture }) {
  const { camera } = useThree()
  const [showBorder, setShowBorder] = useState(false)
  const borderTiles = useMemo(() => generateBorderTiles(), [])

  useFrame(() => {
    const cameraPosition = camera.position as Vector3
    const nearBorder =
      cameraPosition.x < BORDER_RENDER_THRESHOLD ||
      cameraPosition.x > WORLD_SIZE - BORDER_RENDER_THRESHOLD ||
      cameraPosition.z < BORDER_RENDER_THRESHOLD ||
      cameraPosition.z > WORLD_SIZE - BORDER_RENDER_THRESHOLD

    setShowBorder(nearBorder)
  })

  if (!showBorder) return null

  return (
    <>
      {borderTiles.map((tile) => (
        <Tile
          key={`border-${tile.x}-${tile.y}`}
          tile={tile}
          frontTexture={frontTexture}
          backTexture={backTexture}
          onClick={() => {}} // Border tiles are not clickable
        />
      ))}
    </>
  )
}
