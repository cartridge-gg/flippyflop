import { useReducer, useEffect, useRef, useCallback } from 'react'
import { Powerup, Tile as TileModel } from 'src/models'
import { fetchAllEntities, formatAddress, maskAddress, parseTileModel } from 'src/utils'
import { TILE_MODEL_TAG } from '@/constants'
import { useUsernames } from '@/contexts/UsernamesContext'
import { useAccount } from '@starknet-react/core'
import { toast } from 'sonner'
import { ToriiClient } from '@/libs/dojo.c'

type TilesState = {
  tiles: Record<string, TileModel>
  loading: boolean
}

type TilesAction =
  | { type: 'SET_TILES'; payload: Record<string, TileModel> }
  | { type: 'UPDATE_TILES'; payload: Record<string, TileModel> }
  | { type: 'SET_LOADING'; payload: boolean }

function tilesReducer(state: TilesState, action: TilesAction): TilesState {
  switch (action.type) {
    case 'SET_TILES':
      return { ...state, tiles: action.payload }
    case 'UPDATE_TILES':
      return { ...state, tiles: { ...state.tiles, ...action.payload } }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

export function useTiles(client: ToriiClient | undefined) {
  const [state, dispatch] = useReducer(tilesReducer, { tiles: {}, loading: true })
  const subscription = useRef<any>()
  const { usernamesCache } = useUsernames()
  const { address } = useAccount()
  const updateQueue = useRef<Record<string, TileModel>>({})

  const debouncedUpdate = useCallback(() => {
    if (Object.keys(updateQueue.current).length > 0) {
      dispatch({ type: 'UPDATE_TILES', payload: updateQueue.current })
      updateQueue.current = {}
    }
  }, [])

  useEffect(() => {
    if (!client) return

    // Fetch all tiles
    fetchAllEntities(client, (tiles) => dispatch({ type: 'SET_TILES', payload: tiles })).then(() => {
      dispatch({ type: 'SET_LOADING', payload: false })
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

    const intervalId = setInterval(debouncedUpdate, 100)

    return () => {
      subscription.current?.cancel()
      clearInterval(intervalId)
    }
  }, [client, debouncedUpdate])

  const handleEntityUpdate = useCallback(
    async (_hashed_keys: string, entity: any) => {
      if (entity[TILE_MODEL_TAG]) {
        console.log('usernamesCache', usernamesCache)
        console.log('address', address)
        const tile = parseTileModel(entity[TILE_MODEL_TAG])
        const nick = tile.address !== '0x0' ? (usernamesCache?.[tile.address] ?? formatAddress(tile.address)) : 'robot'
        const isMe = tile.address === (address ? maskAddress(address) : undefined)

        toast(
          <div className={`flex ${isMe ? 'text-[#e4945b]' : 'text-white'} flex-row items-start w-full gap-3`}>
            <div className='text-current'>
              {tile.address !== '0x0' ? '🐹' : '👹'}{' '}
              <span className='font-bold text-current'>{isMe ? 'you' : nick}</span>{' '}
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
      }
    },
    [usernamesCache, address],
  )

  const updateTiles = (tiles: Record<string, TileModel>) => {
    dispatch({ type: 'UPDATE_TILES', payload: tiles })
  }

  return { tiles: state.tiles, loading: state.loading, updateTiles }
}
