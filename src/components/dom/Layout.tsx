'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import FlipButton from './FlipButton'
import FlippyFlop from './FlippyFlop'
import Scorebar from './Scorebar'
import { useAsync } from 'react-async-hook'
import { TORII_URL, TORII_RPC_URL, TORII_RELAY_URL, WORLD_ADDRESS, TILE_MODEL_TAG, WORLD_SIZE } from '@/constants'
import { useWasm, WasmProvider } from './WasmContext'
import { Entity, Subscription } from 'dojo.c/pkg'
import { parseModel } from '@/utils'
const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })
import { Tile as TileModel } from 'src/models'

const Layout = ({ children }) => {
  const { wasmRuntime, client } = useWasm()
  const ref = useRef()
  const subscription = useRef<Subscription>()
  const [tiles, setTiles] = useState<Record<string, TileModel>>({})

  useEffect(() => {
    if (!client) return

    client
      .getEntities({
        clause: {
          Keys: {
            keys: [undefined],
            pattern_matching: 'VariableLen',
            models: [TILE_MODEL_TAG],
          },
        },
        limit: 10000,
        offset: 0,
      })
      .then(async (entities) => {
        const tiles = {}
        for (const entity of Object.values(entities)) {
          const tile = parseModel<TileModel>(entity[TILE_MODEL_TAG])
          tiles[`${tile.x},${tile.y}`] = tile
        }
        setTiles(tiles)

        subscription.current = await client.onEntityUpdated(
          [
            {
              Keys: {
                keys: [],
                pattern_matching: 'VariableLen',
                models: [TILE_MODEL_TAG, 'flippyflop-User'],
              },
            },
          ],
          (_hashed_keys: string, entity: Entity) => {
            if (entity[TILE_MODEL_TAG]) {
              const tile = parseModel<TileModel>(entity[TILE_MODEL_TAG])
              setTiles((prev) => ({ ...prev, [`${tile.x},${tile.y}`]: tile }))
            }
          },
        )
      })
  }, [client])

  const humanScore = useMemo(() => Object.values(tiles).filter((tile) => tile.flipped !== '0x0').length, [tiles])
  const botScore = useMemo(() => WORLD_SIZE * WORLD_SIZE - humanScore, [humanScore])

  console.log(humanScore, botScore)

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: ' 100%',
        height: '100%',
        overflow: 'auto',
        touchAction: 'auto',
      }}
    >
      {children}
      <div className='fixed flex flex-col p-4 bg-gradient-to-b from-black/70 to-transparent top-0 z-20 gap-4 items-start justify-start w-full'>
        <FlippyFlop className='' />
        <Scorebar className={'w-full'} humansScore={humanScore} botsScore={botScore} />
      </div>
      <FlipButton
        className='fixed bottom-6 left-1/2 -translate-x-1/2 z-20'
        onClick={() => {
          console.log('flip')
        }}
      />
      <Scene
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
        }}
        eventSource={ref}
        eventPrefix='client'
      />
    </div>
  )
}

export { Layout }
