import { useCallback } from 'react'
import { useAccount, useConnect, useProvider } from '@starknet-react/core'
import { toast } from 'sonner'
import { WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'
import { Scene, Vector3 } from 'three'
import { Camera } from '@react-three/fiber'
import CameraControls from 'camera-controls'
import { useFlipTile } from './useFlipTile'

interface UseFlipProps {
  scene: React.RefObject<Scene>
  camera: React.RefObject<Camera>
  tiles: Record<string, Tile>
  setTiles: React.Dispatch<React.SetStateAction<Record<string, Tile>>>
  playFlipSound: () => void
  controlsRef: React.RefObject<CameraControls>
}

export function useFlip({ scene, camera, tiles, setTiles, playFlipSound, controlsRef }: UseFlipProps) {
  const { provider } = useProvider()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()

  const { flipTile } = useFlipTile({ setTiles, playFlipSound })

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

      await flipTile(wrappedX, wrappedY)
    } else {
      toast('😔 No unflipped tiles found nearby. Try moving to a different area!')
    }
  }, [camera, flipTile, tiles, findNearestUnflippedTile, scene, controlsRef, account, connect, connectors])

  return { handleFlip }
}
