import { useState, useEffect, useRef, useCallback } from 'react'
import { Powerup, Tile as TileModel } from 'src/models'
import { fetchAllEntities, formatAddress, maskAddress, parseTileModel } from 'src/utils'
import { TILE_MODEL_TAG } from '@/constants'
import { useUsernames } from '@/contexts/UsernamesContext'
import { useAccount } from '@starknet-react/core'
import { toast } from 'sonner'
import { ToriiClient } from '@/libs/dojo.c'

export function useTiles(client: ToriiClient | undefined) {
  const [tiles, setTiles] = useState<Record<string, TileModel>>({})
  const [loading, setLoading] = useState(true)
  const subscription = useRef<any>()
  const { usernamesCache } = useUsernames()
  const { address } = useAccount()
  const updateQueue = useRef<Record<string, TileModel>>({})
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!client) return

    // Fetch all tiles
    fetchAllEntities(client, setTiles).then(() => {
      setLoading(false)
    })
    // Subscribe to tile updates
    client
      .onEntityUpdated(
        [
          {
            Keys: {
              keys: [],
              pattern_matching: 'VariableLen',
              models: [TILE_MODEL_TAG, 'flippyflop-User'],
            },
          },
        ],
        handleEntityUpdate,
      )
      .then((sub) => {
        subscription.current = sub
      })

    return () => {
      subscription.current?.cancel()
    }
  }, [client])

  const handleEntityUpdate = useCallback(async (_hashed_keys: string, entity: any) => {
    if (entity[TILE_MODEL_TAG]) {
      const tile = parseTileModel(entity[TILE_MODEL_TAG])
      const nick = tile.address !== '0x0' ? (usernamesCache?.[tile.address] ?? formatAddress(tile.address)) : 'robot'
      const isMe = tile.address === (address ? maskAddress(address) : undefined)

      toast(
        <div className={`flex ${isMe ? 'text-[#F38333]' : 'text-white'} flex-row items-start w-full gap-3`}>
          <div className='text-current'>
            {tile.address !== '0x0' ? '🐹' : '👹'} <span className='font-bold text-current'>{isMe ? 'you' : nick}</span>{' '}
            {tile.address !== '0x0' ? 'flipped' : 'unflipped'} a tile
            {tile.powerup !== Powerup.None && ` with a ${Powerup[tile.powerup]} powerup`}.
          </div>
          <div className='flex-grow'></div>
          <div
            className='flex px-1 justify-center items-center gap-2 rounded-s text-current'
            style={{
              background: 'rgba(255, 255, 255, 0.10)',
            }}
          >
            X {tile.x}, Y {tile.y}
          </div>
        </div>,
      )

      // Add the tile to the update queue
      updateQueue.current[`${tile.x},${tile.y}`] = tile

      // Apply the updates after a delay to avoid excessive re-renders
      if (!updateTimeoutRef.current) {
        updateTimeoutRef.current = setTimeout(() => {
          setTiles((prev) => ({ ...prev, ...updateQueue.current }))
          updateQueue.current = {}
          updateTimeoutRef.current = null
        }, 100)
      }
    }
  }, [])

  return { tiles, setTiles, loading }
}
