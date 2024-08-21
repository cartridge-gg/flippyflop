import {
  TORII_URL,
  TORII_RPC_URL,
  TORII_RELAY_URL,
  WORLD_ADDRESS,
  TILE_MODEL_TAG,
  CHUNK_SIZE,
  CHUNKS,
  WORLD_SIZE,
  CHUNKS_PER_DIMENSION,
  ACTIONS_ADDRESS,
} from '@/constants'
import { parseModel } from 'src/utils'
import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { Tile as TileModel } from 'src/models'
import { OrthographicCamera as Camera, NoToneMapping, TextureLoader, Vector3 } from 'three'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import CheckmarkIcon from '@/components/dom/CheckmarkIcon'
import FlipButton from '@/components/dom/FlipButton'
import FlippyFlop from '@/components/dom/FlippyFlop'
import Leaderboard from '@/components/dom/Leaderboard'
import OrangeButton from '@/components/dom/OrangeButton'
import Scorebar from '@/components/dom/Scorebar'
import UserIcon from '@/components/dom/UserIcon'
import { useAccount, useConnect, useDisconnect, useProvider } from '@starknet-react/core'
import Chunks, { RENDER_DISTANCE } from './components/canvas/Chunks'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createClient, ToriiClient } from '@dojoengine/torii-wasm'
import Scene from './components/Scene'
import FlippyFlopIcon from './components/dom/FlippyFlopIcon'
import toast from 'react-hot-toast'

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
  const { disconnect } = useDisconnect()
  const { account, status } = useAccount()
  const { provider } = useProvider()

  const [username, setUsername] = useState()

  const cartridgeConnector = connectors[0]
  useEffect(() => {
    if (status === 'connected') {
      ;(cartridgeConnector as any).username().then(setUsername)
    }
  }, [status])

  const userScore = useMemo(
    () => Object.values(tiles).filter((tile) => tile.flipped === account?.address).length,
    [tiles, account],
  )
  const humanScore = useMemo(() => Object.values(tiles).filter((tile) => tile.flipped !== '0x0').length, [tiles])
  const botScore = useMemo(() => WORLD_SIZE * WORLD_SIZE - humanScore, [humanScore])

  const leaderboard = useMemo(() => {
    const allEntries = Object.values(tiles).reduce(
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

    const sortedLeaderboard = Object.entries(allEntries)
      .sort(([, a], [, b]) => b - a)
      .map(([address, score], index) => ({ address, score, position: index + 1, type: 'score' }))

    if (!account.address) {
      return sortedLeaderboard.slice(0, 10) // Return top 10 if no account address
    }

    const top5 = sortedLeaderboard.slice(0, 5)
    const userIndex = sortedLeaderboard.findIndex((entry) => entry.address === account.address)

    if (userIndex === -1) {
      return top5 // User not found, return top 5
    } else if (userIndex < 5) {
      return sortedLeaderboard.slice(0, 10) // User is in top 5, return top 10
    }

    const start = Math.max(0, userIndex - 2)
    const end = Math.min(sortedLeaderboard.length, userIndex + 3)
    const userSurroundingScores = sortedLeaderboard.slice(start, end)

    // If user is in top 5, just return the top 5
    if (userIndex < 5) {
      return top5
    }

    // Otherwise, return top 5, separator, and surrounding scores
    return [...top5, { type: 'separator' }, ...userSurroundingScores] as any
  }, [tiles, account.address])

  const camera = useRef<Camera>()
  const [cameraTargetPosition, setCameraTargetPosition] = useState<[number, number]>()
  const [cameraTargetZoom, setCameraTargetZoom] = useState<number>()

  useEffect(() => {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'v') {
        e.preventDefault()
        setCameraTargetZoom((prev) => {
          return ((prev || 30) + 10) % 80
        })
      }
    })
  }, [])

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
        limit: 1000000,
        offset: 0,
      })
      .then(async (entities) => {
        const tiles = {}
        for (const entity of Object.values(entities)) {
          const tile = parseModel<TileModel>(entity[TILE_MODEL_TAG])
          if (tile.x < 0 || tile.y < 0 || tile.x >= WORLD_SIZE || tile.y >= WORLD_SIZE) continue

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

              toast(
                <div className='flex text-white flex-row items-start w-full gap-1'>
                  {tile.flipped !== '0x0' ? '🐹' : '👹'}{' '}
                  <span className='font-bold'>
                    {tile.flipped === account?.address ? 'You' : (tile.flipped as string).substring(0, 6)}...
                    {(tile.flipped as string).substring(61)}
                  </span>{' '}
                  {tile.flipped !== '0x0' ? 'flipped' : 'unflipped'} a tile at{' '}
                  <div
                    className='flex px-1 justify-center items-center gap-2 rounded-s'
                    style={{
                      background: 'rgba(255, 255, 255, 0.10)',
                    }}
                  >
                    X {tile.x}, Y {tile.y}
                  </div>
                </div>,
              )
              setTiles((prev) => ({ ...prev, [`${tile.x},${tile.y}`]: tile }))
            }
          },
        )
      })
  }, [client])

  const [leaderboardOpenedMobile, setLeaderboardOpenedMobile] = useState(false)

  return (
    <>
      <div className='pointer-events-none fixed top-0 z-20 flex w-full flex-col items-start justify-start gap-4 bg-gradient-to-b from-black/70 to-transparent p-4'>
        <div className='flex flex-col-reverse md:flex-row w-full items-start gap-4 md:gap-12'>
          <div className='flex w-full flex-col justify-between gap-4'>
            <FlippyFlop className='hidden md:flex' />
            <Scorebar className={'w-full'} humansScore={humanScore} botsScore={botScore} />
          </div>
          <div className='flex w-full md:w-2/5 flex-col gap-4'>
            <div className='pointer-events-auto flex gap-4'>
              <FlippyFlopIcon className='md:hidden flex-shrink-0' />
              <OrangeButton
                className=''
                icon={<CheckmarkIcon className='' />}
                text={userScore.toString()}
                onClick={() => setLeaderboardOpenedMobile((prev) => !prev)}
              />
              <OrangeButton
                className='w-full'
                icon={<UserIcon />}
                text={account ? username : 'Connect'}
                onClick={() => {
                  if (account) {
                    disconnect()
                    return
                  }

                  connect({
                    connector: cartridgeConnector,
                  })
                }}
              />
            </div>
            <Leaderboard className={`${leaderboardOpenedMobile ? '' : 'hidden'} md:flex`} scores={leaderboard} />
          </div>
        </div>
      </div>
      <FlipButton
        className='fixed bottom-6 left-1/2 z-20 -translate-x-1/2'
        onClick={async () => {
          if (!camera.current) return
          if (!account) {
            connect({
              connector: cartridgeConnector,
            })
            return
          }

          // neg / pos random offset
          let randomOffsetX = Math.floor(Math.random() * (CHUNK_SIZE / 2))
          let randomOffsetY = Math.floor(Math.random() * (CHUNK_SIZE / 2))
          const scaledPos = camera.current.position.clone().subScalar(50)
          const worldX = Math.floor(scaledPos.x / CHUNK_SIZE)
          const worldY = Math.floor(scaledPos.z / CHUNK_SIZE)
          const x = ((worldX % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION
          const y = ((worldY % CHUNKS_PER_DIMENSION) + CHUNKS_PER_DIMENSION) % CHUNKS_PER_DIMENSION

          let tile = tiles[`${x * CHUNK_SIZE + randomOffsetX},${y * CHUNK_SIZE + randomOffsetY}`]
          while (tile && tile.flipped !== '0x0') {
            randomOffsetX++
            randomOffsetY++
            tile = tiles[`${x * CHUNK_SIZE + randomOffsetX},${y * CHUNK_SIZE + randomOffsetY}`]
          }

          setCameraTargetZoom(30)
          setTiles((prev) => ({
            ...prev,
            [`${x * CHUNK_SIZE + randomOffsetX},${y * CHUNK_SIZE + randomOffsetY}`]: {
              x: x * CHUNK_SIZE + randomOffsetX,
              y: y * CHUNK_SIZE + randomOffsetY,
              flipped: account.address,
            },
          }))

          try {
            const tx = await account.execute([
              {
                contractAddress: ACTIONS_ADDRESS,
                entrypoint: 'flip',
                calldata: [
                  '0x' + (x * CHUNK_SIZE + randomOffsetX).toString(16),
                  '0x' + (y * CHUNK_SIZE + randomOffsetY).toString(16),
                ],
              },
            ])

            const flipped = await provider.waitForTransaction(tx.transaction_hash)
            if (!flipped.isSuccess()) {
              setTiles((prev) => {
                const tiles = { ...prev }
                delete tiles[`${x * CHUNK_SIZE + randomOffsetX},${y * CHUNK_SIZE + randomOffsetY}`]
                return tiles
              })
            }

            return true
          } catch (e) {
            return false
          }
        }}
      />
      <div className='h-screen w-screen'>
        <Canvas
          gl={{
            toneMapping: NoToneMapping,
          }}
        >
          <Scene
            tiles={tiles}
            cameraRef={camera}
            cameraTargetPosition={cameraTargetPosition}
            cameraTargetZoom={cameraTargetZoom}
          />
        </Canvas>
      </div>
    </>
  )
}
