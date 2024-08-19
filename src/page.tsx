import {
  TORII_URL,
  TORII_RPC_URL,
  TORII_RELAY_URL,
  WORLD_ADDRESS,
  TILE_MODEL_TAG,
  CHUNK_SIZE,
  CHUNKS,
  WORLD_SIZE,
} from '@/constants'
import { parseModel } from 'src/utils'
import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { Tile as TileModel } from 'src/models'
import { NoToneMapping, TextureLoader, Vector3 } from 'three'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import CheckmarkIcon from '@/components/dom/CheckmarkIcon'
import FlipButton from '@/components/dom/FlipButton'
import FlippyFlop from '@/components/dom/FlippyFlop'
import Leaderboard from '@/components/dom/Leaderboard'
import OrangeButton from '@/components/dom/OrangeButton'
import Scorebar from '@/components/dom/Scorebar'
import UserIcon from '@/components/dom/UserIcon'
import { useAccount, useConnect } from '@starknet-react/core'
import Chunks from './components/canvas/Chunks'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createClient, ToriiClient } from '@dojoengine/torii-wasm'
import { Box, Cylinder, MapControls, OrthographicCamera, Stats } from '@react-three/drei'

export default function Page() {
  const [client, setClient] = useState<ToriiClient>()

  useEffect(() => {
    createClient({
      toriiUrl: TORII_URL,
      rpcUrl: TORII_RPC_URL,
      relayUrl: TORII_RELAY_URL,
      worldAddress: WORLD_ADDRESS,
    }).then(setClient)
  }, [])

  const subscription = useRef<any>()
  const [tiles, setTiles] = useState<Record<string, TileModel>>({})

  const { connect, connectors } = useConnect()
  const { account, status } = useAccount()

  const [username, setUsername] = useState()

  const cartridgeConnector = connectors[0]
  useEffect(() => {
    if (status === 'connected') {
      ;(cartridgeConnector as any).username().then(setUsername)
    }
  }, [status])

  const humanScore = useMemo(() => Object.values(tiles).filter((tile) => tile.flipped !== '0x0').length, [tiles])
  const botScore = useMemo(() => WORLD_SIZE * WORLD_SIZE - humanScore, [humanScore])

  const leaderboard = useMemo(() => {
    return Object.values(tiles).reduce(
      (acc, tile) => {
        if (tile.flipped === '0x0') {
          return acc
        }

        if (!acc[tile.flipped as string]) {
          acc[tile.flipped as string] = 0
        }

        acc[tile.flipped as string]++

        return acc
      },
      {} as Record<string, number>,
    )
  }, [tiles])

  const cameraRef = useRef<any>()

  useEffect(() => {
    if (!client) return

    client
      .getEntities({
        clause: {
          Member: {
            member: 'flipped',
            model: TILE_MODEL_TAG,
            operator: 'Neq',
            value: {
              ContractAddress: '0x0',
            },
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
          (_hashed_keys: string, entity: any) => {
            if (entity[TILE_MODEL_TAG]) {
              const tile = parseModel<TileModel>(entity[TILE_MODEL_TAG])
              setTiles((prev) => ({ ...prev, [`${tile.x},${tile.y}`]: tile }))
            }
          },
        )
      })
  }, [client])

  return (
    <>
      <div className='pointer-events-none fixed top-0 z-20 flex w-full flex-col items-start justify-start gap-4 bg-gradient-to-b from-black/70 to-transparent p-4'>
        <div className='flex w-full items-start gap-12'>
          <div className='flex w-full flex-col justify-between gap-4'>
            <FlippyFlop className='' />
            <Scorebar className={'w-full'} humansScore={humanScore} botsScore={botScore} />
          </div>
          <div className='flex w-2/5 flex-col gap-4'>
            <div className='pointer-events-auto flex gap-4'>
              <OrangeButton className='' icon={<CheckmarkIcon className='' />} text={humanScore.toString()} />
              <OrangeButton
                className='w-full'
                icon={<UserIcon />}
                text={status === 'disconnected' ? 'Connect' : username}
                onClick={async () => {
                  connect({
                    connector: cartridgeConnector,
                  })
                }}
              />
            </div>
            <Leaderboard scores={leaderboard} />
          </div>
        </div>
      </div>
      <FlipButton
        className='fixed bottom-6 left-1/2 z-20 -translate-x-1/2'
        onClick={() => {
          if (!cameraRef.current) return
          if (!account) {
            connect({
              connector: cartridgeConnector,
            })
          }
        }}
      />
      <div className='h-screen w-screen'>
        <Canvas
          gl={{
            toneMapping: NoToneMapping,
          }}
        >
          <color attach='background' args={['#9c9c9c']} />
          <ambientLight />
          <OrthographicCamera ref={cameraRef} makeDefault position={[200, 200, 200]} zoom={80} />
          <Stats />
          <Chunks entities={tiles} />
          <MapControls
            // screenSpacePanning
            minZoom={50}
            maxZoom={200}
            maxPolarAngle={Math.PI / 2.5}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
            minDistance={10}
            maxDistance={WORLD_SIZE}
          />
        </Canvas>
      </div>
    </>
  )
}
