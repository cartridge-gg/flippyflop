import { useCallback } from 'react'
import { useAccount, useConnect, useProvider } from '@starknet-react/core'
import toast from 'react-hot-toast'
import { CHUNK_SIZE, CHUNKS_PER_DIMENSION, ACTIONS_ADDRESS, WORLD_SIZE } from '@/constants'
import { Powerup, Tile } from 'src/models'
import { Vector3, Raycaster, Scene, Vector2, InstancedMesh, Matrix4 } from 'three'
import { Camera, useThree } from '@react-three/fiber'
import CameraControls from 'camera-controls'
import { getChunkAndLocalPosition } from '@/utils'
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
    (x: number, y: number): { x: number; y: number } | null => {
      const searchRadius = 5

      for (let radius = 0; radius <= searchRadius; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
              const tileX = (((x + dx) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
              const tileY = (((y + dy) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
              const tileKey = `${tileX},${tileY}`
              if (!tiles[tileKey] || tiles[tileKey].address === '0x0') {
                return { x: tileX, y: tileY }
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
    const tileX = Math.floor(worldPosition.x / 1.1)
    const tileY = Math.floor(worldPosition.z / 1.1)

    // Find the nearest unflipped tile using wrapped coordinates
    const unflippedTile = findNearestUnflippedTile(tileX, tileY)
    if (unflippedTile) {
      const { x: wrappedX, y: wrappedY } = unflippedTile

      if (controlsRef.current) {
        const targetPosition = new Vector3(tileX * 1.1, 0, tileY * 1.1)
        targetPosition.addScalar(camera.current.position.y)

        console.log(targetPosition)
        controlsRef.current.moveTo(targetPosition.x, targetPosition.y, targetPosition.z, true)
        controlsRef.current.zoomTo(100, true)
      }

      await flipTile(wrappedX, wrappedY)
    } else {
      toast('😔 No unflipped tiles found nearby. Try moving to a different area!')
    }
  }, [camera, flipTile, tiles, findNearestUnflippedTile, scene, controlsRef, account, connect, connectors])

  return { handleFlip }
}
