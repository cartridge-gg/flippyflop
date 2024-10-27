import { useAccount, useConnect, useProvider } from '@starknet-react/core'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { useFlipTile } from './useFlipTile'
import { WORLD_SIZE } from '@/constants'

import type { Tile } from '@/models'
import type { Camera } from '@react-three/fiber'
import type CameraControls from 'camera-controls'
import type { Scene } from 'three'

interface UseFlipProps {
  scene: React.RefObject<Scene>
  camera: React.RefObject<Camera>
  tiles: Record<string, Tile>
  updateTile: (tile: Tile) => () => void
  playFlipSound: () => void
  controlsRef: React.RefObject<CameraControls>
  selectedTeam: number
  timeRange: [number, number]
  isLoading: boolean
}

export function useFlip({
  scene,
  camera,
  tiles,
  updateTile,
  playFlipSound,
  controlsRef,
  selectedTeam,
  timeRange,
  isLoading,
}: UseFlipProps) {
  const { provider } = useProvider()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()

  const { flipTile } = useFlipTile({ updateTile, playFlipSound, timeRange, isLoading })

  const findNearestUnflippedTile = useCallback(
    (x: number, y: number): { x: number; y: number; dx: number; dy: number } | null => {
      const searchRadius = 10

      for (let radius = 0; radius <= searchRadius; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
              const tileX = (((x + dx) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
              const tileY = (((y + dy) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
              const tileKey = `${tileX},${tileY}`
              if (!tiles[tileKey] || tiles[tileKey].address === '0x0') {
                return { x: tileX, y: tileY, dx, dy }
              }
            }
          }
        }
      }
      return null
    },
    [tiles],
  )

  const handleFlip = useCallback(async () => {
    if (!camera.current || !controlsRef.current || !scene.current) return
    if (!account) {
      connect({ connector: connectors[0] })
      return
    }

    // Get the world position of camera according to tiles
    const worldPosition = camera.current.position.clone().subScalar(camera.current.position.y)

    // Convert world position to tile coordinates
    const cameraTileX = Math.floor(worldPosition.x / 1.1)
    const cameraTileY = Math.floor(worldPosition.z / 1.1)

    // Find the nearest unflipped tile using wrapped coordinates
    const unflippedTile = findNearestUnflippedTile(cameraTileX, cameraTileY)
    if (unflippedTile) {
      const { x: wrappedX, y: wrappedY, dx, dy } = unflippedTile

      if (controlsRef.current) {
        if (dx > 5 || dy > 5) {
          controlsRef.current.truck(dx * 1.1, dy * 1.1, true)
        }
        controlsRef.current.zoomTo(100, true)
      }

      await flipTile(wrappedX, wrappedY, selectedTeam)
    } else {
      toast('😔 No unflipped tiles found nearby. Try moving to a different area!')
    }
  }, [
    camera,
    flipTile,
    tiles,
    findNearestUnflippedTile,
    scene,
    controlsRef,
    account,
    connect,
    connectors,
    selectedTeam,
  ])

  return { handleFlip }
}
