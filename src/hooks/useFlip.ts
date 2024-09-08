import { useCallback } from 'react'
import { Connector, useAccount, useConnect, useProvider } from '@starknet-react/core'
import toast from 'react-hot-toast'
import { CHUNK_SIZE, CHUNKS_PER_DIMENSION, ACTIONS_ADDRESS, WORLD_SIZE } from '@/constants'
import { Powerup, Tile } from 'src/models'
import { Vector3 } from 'three'
import { Camera } from '@react-three/fiber'
import CameraControls from 'camera-controls'

interface UseFlipProps {
  camera: React.RefObject<Camera>
  tiles: Record<string, Tile>
  setTiles: React.Dispatch<React.SetStateAction<Record<string, Tile>>>
  playFlipSound: () => void
  controlsRef: React.RefObject<CameraControls>
}

export function useFlip({ camera, tiles, setTiles, playFlipSound, controlsRef }: UseFlipProps) {
  const { provider } = useProvider()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()

  const findNearestUnflippedTile = useCallback(
    (centerX: number, centerY: number): { x: number; y: number; dx: number; dy: number } | null => {
      const searchRadius = 5
      for (let radius = 0; radius <= searchRadius; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
              const x = (centerX + dx + WORLD_SIZE) % WORLD_SIZE
              const y = (centerY + dy + WORLD_SIZE) % WORLD_SIZE
              const tileKey = `${x},${y}`
              if (!tiles[tileKey] || tiles[tileKey].address === '0x0') {
                return { x, y, dx, dy }
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
    if (!camera.current) return
    if (!account) {
      connect({ connector: connectors[0] })
      return
    }

    const cameraPosition = camera.current.position.clone().subScalar(camera.current.position.y)
    const worldX = Math.floor(cameraPosition.x / CHUNK_SIZE)
    const worldY = Math.floor(cameraPosition.z / CHUNK_SIZE)

    const unflippedTile = findNearestUnflippedTile(worldX, worldY)
    if (unflippedTile) {
      const { x, y, dx, dy } = unflippedTile
      setTiles((prev) => ({
        ...prev,
        [`${x},${y}`]: { x, y, address: account.address, powerup: Powerup.None, powerupValue: 0 },
      }))
      playFlipSound()

      // Move camera to flipped tile using truck
      if (controlsRef.current) {
        const deltaX = dx * CHUNK_SIZE
        const deltaZ = dy * CHUNK_SIZE
        controlsRef.current.truck(deltaX, deltaZ, true)
        controlsRef.current.zoomTo(120, true)
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
  }, [camera, account, connect, connectors, tiles, setTiles, playFlipSound, controlsRef, findNearestUnflippedTile])

  return { handleFlip }
}
