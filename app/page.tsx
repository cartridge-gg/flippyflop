'use client'

import { TORII_URL, TORII_RPC_URL, TORII_RELAY_URL, WORLD_ADDRESS, TILE_MODEL_TAG, CHUNK_SIZE } from '@/constants'
import { initializeTiles, parseModel } from 'src/utils'
import { Entities, Entity } from 'dojo.c/pkg'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Tile as TileModel } from 'src/models'
import { BigNumberish } from 'starknet'

const Tile = dynamic(() => import('@/components/canvas/Tile').then((mod) => mod.default), { ssr: false })
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 size-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

export default function Page() {
  const wasmRuntime = useAsync(async () => import('dojo.c/pkg'), [])

  const client = useAsync(async () => {
    return await wasmRuntime.result.createClient({
      toriiUrl: TORII_URL,
      rpcUrl: TORII_RPC_URL,
      relayUrl: TORII_RELAY_URL,
      worldAddress: WORLD_ADDRESS,
    })
  }, [wasmRuntime.result])

  // window.wasm = wasmRuntime.result

  // 10000 initial tiles
  const [currentChunk, setCurrentChunk] = useState([0, 0])
  const [tiles, setTiles] = useState<TileModel[]>(initializeTiles(currentChunk[0], currentChunk[1]))

  const subscription = useAsync(
    async () =>
      client.result.onEntityUpdated(
        [
          {
            Keys: {
              keys: [],
              pattern_matching: 'VariableLen',
              models: [TILE_MODEL_TAG],
            },
          },
        ],
        (hashed_keys: string, entity: Entity) => {
          console.log('entity updated', entity)
          const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
          setTiles((tiles) => {
            const idx = parsedModel.x * CHUNK_SIZE + parsedModel.y
            tiles[idx] = parsedModel
            return Array.from(tiles)
          })
        },
      ),
    [client.result],
  )

  useEffect(() => {
    if (!client.result) return

    client.result
      .getEntities({
        clause: {
          Composite: {
            clauses: [
              {
                Member: {
                  member: 'x',
                  model: TILE_MODEL_TAG,
                  operator: 'Gte',
                  value: { U32: currentChunk[0] * CHUNK_SIZE },
                },
              },
              {
                Member: {
                  member: 'x',
                  model: TILE_MODEL_TAG,
                  operator: 'Lt',
                  value: { U32: (currentChunk[0] + 1) * CHUNK_SIZE },
                },
              },
              {
                Member: {
                  member: 'y',
                  model: TILE_MODEL_TAG,
                  operator: 'Gte',
                  value: { U32: currentChunk[1] * CHUNK_SIZE },
                },
              },
              {
                Member: {
                  member: 'y',
                  model: TILE_MODEL_TAG,
                  operator: 'Lt',
                  value: { U32: (currentChunk[1] + 1) * CHUNK_SIZE },
                },
              },
            ],
            operator: 'And',
          },
        },
        limit: 20 * 20,
        offset: 0,
      })
      .then((entities) => {
        setTiles((tiles) => {
          Object.values(entities).forEach((entity) => {
            const parsedModel = parseModel<TileModel>(entity[TILE_MODEL_TAG])
            const idx = parsedModel.x * CHUNK_SIZE + parsedModel.y
            tiles[idx] = parsedModel
          })
          return Array.from(tiles)
        })
      })
  }, [client.result, currentChunk])

  return (
    <>
      <View orbit className='flex h-screen w-full flex-col items-center justify-center'>
        <Suspense fallback={null}>
          {Object.entries(tiles).map(([key, tile]) => (
            <Tile
              key={key}
              tile={tile}
              onClick={(x, y) =>
                setTiles((tiles) => {
                  const idx = x * CHUNK_SIZE + y
                  tiles[idx] = { x, y, flipped: '0x1' }
                  return Array.from(tiles)
                })
              }
            />
          ))}
          <Common color='#737782' />
        </Suspense>
      </View>
    </>
  )
}
