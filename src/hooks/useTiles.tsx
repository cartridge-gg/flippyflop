import { useReducer, useEffect, useRef, useCallback, useMemo } from 'react'
import { Powerup, Tile as TileModel } from 'src/models'
import { fetchAllEntities, formatAddress, maskAddress, parseTileModel } from 'src/utils'
import { TILE_MODEL_TAG } from '@/constants'
import { useUsernames } from '@/contexts/UsernamesContext'
import { useAccount } from '@starknet-react/core'
import { toast } from 'sonner'
import { ToriiClient } from '@/libs/dojo.c'

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

type TilesState = {
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
  const toastQueue = useRef<Array<{ tile: TileModel; isMe: boolean; nick: string }>>([])

  const debouncedUpdate = useCallback(() => {
    if (Object.keys(updateQueue.current).length > 0) {
      dispatch({ type: 'UPDATE_TILES', payload: updateQueue.current })
      updateQueue.current = {}
    }

    if (toastQueue.current.length > 0) {
      const grouped = groupBy(toastQueue.current, (item) => (item.tile.address === '0x0' ? 'robot' : item.nick))

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
          items.slice(0, 3).forEach(({ tile, isMe, nick }) => {
            toast(
              <div className={`flex ${isMe ? 'text-[#F38333]' : 'text-white'} flex-row items-start w-full gap-3`}>
                <div className='text-current'>
                  🐹 <span className='font-bold text-current'>{isMe ? 'you' : nick}</span> flipped a tile
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
          })
          if (items.length > 3) {
            toast(
              <div className='flex text-white flex-row items-start w-full gap-3'>
                <div className='text-current'>
                  ... and {items.length - 3} more flips by {key}.
                </div>
              </div>,
            )
          }
        }
      })

      toastQueue.current = []
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

        toastQueue.current.push({ tile, isMe, nick })
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
