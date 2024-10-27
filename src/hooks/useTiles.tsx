import { useAccount } from '@starknet-react/core'
import { useReducer, useEffect, useRef, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Powerup } from 'src/models'
import { fetchAllEntities, formatAddress, parseTileModel } from 'src/utils'

import { TILE_MODEL_TAG } from '@/constants'
import { useUsernames } from '@/contexts/UsernamesContext'

import type { ToriiClient } from '@/libs/dojo.c'
import type { Tile as TileModel } from 'src/models'

function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const key = keyFn(item)
      if (!result[key]) {
        result[key] = []
      }
      result[key].push(item)
      return result
    },
    {} as Record<string, T[]>,
  )
}

interface TilesState {
  tiles: Record<string, TileModel>
  loading: boolean
}

type TilesAction =
  | { type: 'SET_TILES'; payload: Record<string, TileModel> }
  | { type: 'UPDATE_TILES'; payload: Record<string, TileModel> }
  | { type: 'UPDATE_TILE'; payload: { key: string; tile: TileModel | undefined } }
  | { type: 'SET_LOADING'; payload: boolean }

function tilesReducer(state: TilesState, action: TilesAction): TilesState {
  switch (action.type) {
    case 'SET_TILES':
      return { ...state, tiles: action.payload }
    case 'UPDATE_TILES':
      return { ...state, tiles: { ...state.tiles, ...action.payload } }
    case 'UPDATE_TILE':
      // if the tile is undefined, remove it from the state
      if (action.payload.tile === undefined) {
        const { [action.payload.key]: _, ...restTiles } = state.tiles
        return { ...state, tiles: restTiles }
      }
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
  const toastQueue = useRef<Array<{ tile: TileModel; nick: string }>>([])

  const usernamesRef = useRef<Record<string, string>>({})
  const addressRef = useRef<string | undefined>(address)

  useEffect(() => {
    addressRef.current = address
    usernamesRef.current = usernamesCache
  }, [address, usernamesCache])

  const debouncedUpdate = () => {
    if (Object.keys(updateQueue.current).length > 0) {
      dispatch({ type: 'UPDATE_TILES', payload: updateQueue.current })
      updateQueue.current = {}
    }

    if (toastQueue.current.length > 0) {
      const grouped = groupBy(toastQueue.current, (item) => (item.tile.address === '0x0' ? 'robot' : 'user'))

      Object.entries(grouped).forEach(([key, items]) => {
        if (key === 'robot') {
          const count = items.length
          toast(
            <div className='flex text-white flex-row items-start w-full gap-3'>
              <div className='text-current'>
                👹 robot unflipped {count} {count === 1 ? 'tile' : 'tiles'}.
              </div>
            </div>,
          )
        } else {
          const userCount = new Set(items.map((item) => item.nick)).size
          const tileCount = items.length

          if (tileCount <= 3) {
            items.forEach(({ tile, nick }) => {
              toast(
                <div className='flex text-white flex-row items-start w-full gap-3'>
                  <div className='text-current'>
                    🐹 <span className='font-bold text-current'>{nick}</span> flipped a tile
                    {tile.powerup !== Powerup.None && ` with a ${tile.powerupValue}x powerup`}.
                  </div>
                  <div className='flex-grow' />
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
            })
          } else {
            toast(
              <div className='flex text-white flex-row items-start w-full gap-3'>
                <div className='text-current'>
                  🐹 {tileCount} tiles flipped by {userCount} {userCount === 1 ? 'user' : 'users'}.
                </div>
              </div>,
            )
          }
        }
      })

      toastQueue.current = []
    }
  }

  const handleEntityUpdate = async (_hashed_keys: string, entity: any) => {
    if (entity[TILE_MODEL_TAG]) {
      const tile = parseTileModel(entity[TILE_MODEL_TAG])
      const nick =
        tile.address !== '0x0' ? (usernamesRef.current?.[tile.address] ?? formatAddress(tile.address)) : 'robot'

      toastQueue.current.push({ tile, nick })
      updateQueue.current[`${tile.x},${tile.y}`] = tile
    }
  }

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
  }, [client])

  const updateTile = useCallback(
    (tile: TileModel) => {
      const key = `${tile.x},${tile.y}`
      const oldTile = state.tiles[key]
      dispatch({ type: 'UPDATE_TILE', payload: { key, tile } })

      return () => {
        dispatch({ type: 'UPDATE_TILE', payload: { key, tile: oldTile } })
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
