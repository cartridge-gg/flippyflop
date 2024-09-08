import { useCallback } from 'react'
import { useAccount, useConnect, useProvider } from '@starknet-react/core'
import toast from 'react-hot-toast'
import { CHUNK_SIZE, CHUNKS_PER_DIMENSION, ACTIONS_ADDRESS, WORLD_SIZE } from '@/constants'
import { Powerup, Tile } from 'src/models'
import { Vector3, Raycaster, Scene, Vector2, InstancedMesh, Matrix4 } from 'three'
import { Camera, useThree } from '@react-three/fiber'
import CameraControls from 'camera-controls'
import { getChunkAndLocalPosition } from '@/utils'

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

  const findNearestUnflippedTile = useCallback(
    (x: number, y: number): { x: number; y: number } | null => {
      const searchRadius = 5

      for (let radius = 0; radius <= searchRadius; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
              const tileX = (x + dx + WORLD_SIZE) % WORLD_SIZE
              const tileY = (y + dy + WORLD_SIZE) % WORLD_SIZE
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

    // Find the tile the camera is pointing at
    const raycaster = new Raycaster()
    const centerViewport = new Vector2(0.5, 0.5)
    raycaster.setFromCamera(centerViewport, camera.current)
    const intersects = raycaster.intersectObjects(scene.current.children, true)

    if (intersects.length === 0) {
      toast('😔 No tile found. Please try again.')
      return
    }

    const intersectedObject = intersects[0].object
    if (!(intersectedObject instanceof InstancedMesh)) {
      toast('😔 Invalid tile. Please try again.')
      return
    }

    const instanceId = intersects[0].instanceId
    if (instanceId === undefined) {
      toast('😔 Invalid tile. Please try again.')
      return
    }

    const matrix = new Matrix4()
    intersectedObject.getMatrixAt(instanceId, matrix)
    const position = new Vector3()
    position.setFromMatrixPosition(matrix)
    const tileX = Math.floor(position.x / 1.1)
    const tileY = Math.floor(position.z / 1.1)

    // Find the nearest unflipped tile
    const unflippedTile = findNearestUnflippedTile(tileX, tileY)
    if (unflippedTile) {
      const { x, y } = unflippedTile
      setTiles((prev) => ({
        ...prev,
        [`${x},${y}`]: { x, y, address: account.address, powerup: Powerup.None, powerupValue: 0 },
      }))
      playFlipSound()

      // Move camera to flipped tile
      if (controlsRef.current) {
        const currentPosition = new Vector3()
        camera.current.getWorldPosition(currentPosition)

        const targetPosition = new Vector3(position.x, 0, position.z)
        targetPosition.addScalar(currentPosition.y)

        controlsRef.current.moveTo(targetPosition.x, targetPosition.y, targetPosition.z, true)
        controlsRef.current.zoomTo(100, true)
      }

      try {
        const tx = await account.execute([
          {
            contractAddress: ACTIONS_ADDRESS,
            entrypoint: 'flip',
            calldata: ['0x' + x.toString(16), '0x' + y.toString(16)],
          },
        ])

        const flipped = await provider.waitForTransaction(tx.transaction_hash)
        if (!flipped.isSuccess()) {
          setTiles((prev) => {
            const tiles = { ...prev }
            delete tiles[`${x},${y}`]
            return tiles
          })
        }
      } catch (e) {
        console.error('Error flipping tile:', e)
        toast('😔 Failed to flip tile. Please try again.')
      }
    } else {
      toast('😔 No unflipped tiles found nearby. Try moving to a different area!')
    }
  }, [
    camera,
    account,
    connect,
    connectors,
    tiles,
    setTiles,
    playFlipSound,
    controlsRef,
    findNearestUnflippedTile,
    scene,
  ])

  return { handleFlip }
}
