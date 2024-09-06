import { useCallback } from 'react'
import { useProvider } from '@starknet-react/core'
import toast from 'react-hot-toast'
import { CHUNK_SIZE, CHUNKS_PER_DIMENSION, ACTIONS_ADDRESS } from '@/constants'
import { Powerup } from 'src/models'

export function useFlip(camera, account, connect, cartridgeConnector, tiles, setTiles, playFlipSound) {
  const { provider } = useProvider()

  const handleFlip = useCallback(async () => {
    if (!camera.current) return
    if (!account) {
      connect({ connector: cartridgeConnector })
      return
    }

    const scaledPos = camera.current.position.clone().subScalar(camera.current.position.y)
    const worldX = Math.floor(scaledPos.x / CHUNK_SIZE)
    const worldY = Math.floor(scaledPos.z / CHUNK_SIZE)

    const unflippedTile = findNearestUnflippedTile(worldX, worldY, tiles)
    if (unflippedTile) {
      await flipTile(unflippedTile.x, unflippedTile.y)
    } else {
      toast('😔 No unflipped tiles found nearby. Try moving to a different area!')
    }
  }, [camera, account, connect, cartridgeConnector, tiles, setTiles, playFlipSound])

  const findNearestUnflippedTile = (centerX, centerY, tiles) => {
    const searchRadius = 2
    for (let offsetX = -searchRadius; offsetX <= searchRadius; offsetX++) {
      for (let offsetY = -searchRadius; offsetY <= searchRadius; offsetY++) {
        const x = (((centerX + offsetX) % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION
        const y = (((centerY + offsetY) % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION
        const unflippedTile = findUnflippedTileInChunk(x, y, tiles)
        if (unflippedTile) return unflippedTile
      }
    }
    return null
  }

  const findUnflippedTileInChunk = (chunkX, chunkY, tiles) => {
    for (let offsetX = 0; offsetX < CHUNK_SIZE; offsetX++) {
      for (let offsetY = 0; offsetY < CHUNK_SIZE; offsetY++) {
        const x = chunkX * CHUNK_SIZE + offsetX
        const y = chunkY * CHUNK_SIZE + offsetY
        const tile = tiles[`${x},${y}`]
        if (!tile || tile.flipped === '0x0') {
          return { x, y }
        }
      }
    }
    return null
  }

  const flipTile = async (x, y) => {
    setTiles((prev) => ({
      ...prev,
      [`${x},${y}`]: { x, y, address: account.address, powerup: Powerup.None, powerupValue: 0 },
    }))
    playFlipSound()

    setTimeout(async () => {
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
    })
  }

  return { handleFlip }
}
