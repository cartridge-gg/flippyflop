import { useReducer, useEffect, useRef, useCallback, useMemo } from 'react'
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
  | { type: 'UPDATE_TILE'; payload: { key: string; tile: TileModel } }
  | { type: 'SET_LOADING'; payload: boolean }

function tilesReducer(state: TilesState, action: TilesAction): TilesState {
  switch (action.type) {
    case 'SET_TILES':
      return { ...state, tiles: action.payload }
    case 'UPDATE_TILES':
      return { ...state, tiles: { ...state.tiles, ...action.payload } }
    case 'UPDATE_TILE':
      return { ...state, tiles: { ...state.tiles, [action.payload.key]: action.payload.tile } }
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

    fetchAllEntities(client, (tiles) => dispatch({ type: 'UPDATE_TILES', payload: tiles })).then(() => {
      dispatch({ type: 'SET_LOADING', payload: false })
    })

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
        const tile = parseTileModel(entity[TILE_MODEL_TAG])
        const nick = tile.address !== '0x0' ? (usernamesCache?.[tile.address] ?? formatAddress(tile.address)) : 'robot'
        const isMe = tile.address === (address ? maskAddress(address) : undefined)

        toast(
          <div className={`flex ${isMe ? 'text-[#F38333]' : 'text-white'} flex-row items-start w-full gap-3`}>
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

        updateQueue.current[`${tile.x},${tile.y}`] = tile
      }
    },
    [usernamesCache, address],
  )

  const updateTile = useCallback(
    (tile: TileModel) => {
      const key = `${tile.x},${tile.y}`
      const oldTile = state.tiles[key]
      dispatch({ type: 'UPDATE_TILE', payload: { key, tile } })

      return () => {
        if (oldTile) {
          dispatch({ type: 'UPDATE_TILE', payload: { key, tile: oldTile } })
        } else {
          const { [key]: _, ...restTiles } = state.tiles
          dispatch({ type: 'SET_TILES', payload: restTiles })
        }
      }
    },
    [state.tiles],
  )

  return useMemo(
    () => ({
      tiles: state.tiles,
      loading: state.loading,
      updateTile,
    }),
    [state.tiles, state.loading, updateTile],
  )
}
