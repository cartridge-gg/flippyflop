import { useEffect, useRef, useState } from 'react'
import { NoToneMapping } from 'three'
import { Canvas } from '@react-three/fiber'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'
import useSound from 'use-sound'
import FlipSound from '@/../public/sfx/flip.mp3'

import { WORLD_SIZE } from '@/constants'
import { useClient } from '@/hooks/useClient'
import { useTiles } from '@/hooks/useTiles'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useFlip } from '@/hooks/useFlip'
import { UsernamesProvider, useUsernames } from '@/contexts/UsernamesContext'

import Header from '@/components/dom/Header'
import FlipButton from '@/components/dom/FlipButton'
import Scene from '@/components/canvas/Scene'

export default function Page() {
  const { client } = useClient()
  const { tiles, setTiles } = useTiles(client)
  const { account, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const address = account?.address

  const { leaderboard } = useLeaderboard(tiles, address)
  const { usernamesCache } = useUsernames()

  const camera = useRef()
  const controlsRef = useRef()

  const userScore = Object.values(tiles).filter((tile) => tile.address === address).length
  const humanScore = Object.values(tiles).filter((tile) => tile.address !== '0x0').length
  const botScore = WORLD_SIZE * WORLD_SIZE - humanScore

  const [playFlipSound] = useSound(FlipSound)
  const { handleFlip } = useFlip({ camera, tiles, setTiles, playFlipSound, controlsRef })

  return (
    <>
      <Header userScore={userScore} humanScore={humanScore} botScore={botScore} leaderboard={leaderboard} />
      <FlipButton className='fixed bottom-6 left-1/2 z-20 -translate-x-1/2' onClick={handleFlip} />
      <div className='h-screen w-screen'>
        <Canvas gl={{ toneMapping: NoToneMapping }}>
          <Scene tiles={tiles} cameraRef={camera} playFlipSound={playFlipSound} controlsRef={controlsRef} />
        </Canvas>
      </div>
    </>
  )
}
