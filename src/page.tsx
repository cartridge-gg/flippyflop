import { Canvas } from '@react-three/fiber'
import { useAccount } from '@starknet-react/core'
import { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useEffect, useRef, useState } from 'react'
import Confetti from 'react-confetti'
import { NoToneMapping } from 'three'
import useSound from 'use-sound'

import AutoFlipIcon from './components/dom/AutoFlipIcon'
import TeamSwitchButton from './components/dom/TeamSwitchButton'
import { TEAMS, TILE_REGISTRY } from './constants'
import { useGame } from './hooks/useGame'
import { useIndexerUpdate } from './hooks/useIndexerUpdate'
import FlipSound from '@/../public/sfx/flip.mp3'
import Scene from '@/components/canvas/Scene'
import FlipButton from '@/components/dom/FlipButton'
import Header from '@/components/dom/Header'
import { useClient } from '@/hooks/useClient'
import { useFlip } from '@/hooks/useFlip'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useTiles } from '@/hooks/useTiles'

import type { Scene as ThreeScene } from 'three'

// Add this CSS to your global styles or as a styled component
const pulseAnimation = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }
`

export default function Page() {
  const { client } = useClient()
  const { address } = useAccount()
  const [selectedTeam, setSelectedTeam] = useState<number>(
    localStorage.getItem('selectedTeam')
      ? parseInt(localStorage.getItem('selectedTeam')!, 10)
      : Math.floor(Math.random() * 6),
  )

  const camera = useRef()
  const controlsRef = useRef()
  const scene = useRef<ThreeScene>()
  const { timeRange, claimed, balance, isStarted, showConfetti, isEnded } = useGame(client)
  const { tiles, updateTile, loading } = useTiles(client, isEnded)
  const { leaderboard } = useLeaderboard(tiles)

  const [playFlipSound] = useSound(FlipSound, {
    volume: 0.5,
  })
  const { handleFlip } = useFlip({
    scene,
    camera,
    tiles,
    updateTile,
    playFlipSound,
    controlsRef,
    selectedTeam,
    timeRange,
    isLoading: loading,
  })

  const [isAutoFlipping, setIsAutoFlipping] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [rotationDegrees, setRotationDegrees] = useState(0)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
      // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
      // starting from v2 you can add only the features you need reducing the bundle size
      // await loadAll(engine);
      // await loadFull(engine);
      await loadSlim(engine)
      // await loadBasic(engine);
    })
  }, [])

  const { tps } = useIndexerUpdate(client)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isAutoFlipping && !loading && isStarted) {
      interval = setInterval(() => {
        handleFlip()
        setRotationDegrees((prev) => prev + 360)
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isAutoFlipping, loading, isStarted, handleFlip])

  return (
    <>
      <div className='fixed flex flex-row gap-2 w-[100vw] bottom-6 left-1/2 z-20 -translate-x-1/2 justify-center'>
        <FlipButton
          className=''
          onClick={handleFlip}
          isLoading={loading}
          selectedTeam={selectedTeam}
          timeRange={timeRange}
        />
        <button
          onClick={() => {
            setIsAutoFlipping(!isAutoFlipping)
            setRotationDegrees((prev) => prev + 360)
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            w-16 h-16 flex justify-center items-center
            rounded-full bg-gradient-to-b
            transition-all duration-500 ease-in-out
            ${isHovered ? 'shadow-lg scale-105' : 'shadow-md scale-100'}
            ${!isStarted || loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            backdropFilter: 'blur(5.575680255889893px)',
            background: `linear-gradient(to bottom, ${TILE_REGISTRY[TEAMS[selectedTeam]].background}, ${TILE_REGISTRY[TEAMS[selectedTeam]].border})`,
          }}
          disabled={!isStarted || loading}
        >
          <div
            className='w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 relative'
            style={{
              border: `1px dashed ${TILE_REGISTRY[TEAMS[selectedTeam]].face}`,
            }}
          >
            {isAutoFlipping && (
              <div
                className='absolute inset-0 rounded-full animate-ping'
                style={{
                  border: `3px solid ${TILE_REGISTRY[TEAMS[selectedTeam]].face}`,
                  opacity: 0.4,
                }}
              />
            )}
            <div
              className='transition-all ease-in-out'
              style={{
                transitionDuration: '350ms',
                transform: `rotate(${rotationDegrees}deg)`,
                color: TILE_REGISTRY[TEAMS[selectedTeam]].side,
              }}
            >
              <AutoFlipIcon className='w-6 h-6' />
            </div>
          </div>
        </button>
        <TeamSwitchButton className='lg:hidden' selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
      </div>
      <Header
        tiles={tiles}
        tps={tps}
        leaderboard={leaderboard}
        isLoading={loading}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        timeRange={timeRange}
        claimed={claimed}
        balance={balance}
      />
      <div className='h-screen w-screen'>
        <Canvas dpr={window.devicePixelRatio} gl={{ toneMapping: NoToneMapping }}>
          <Scene
            sceneRef={scene}
            tiles={tiles}
            cameraRef={camera}
            updateTile={updateTile}
            playFlipSound={playFlipSound}
            controlsRef={controlsRef}
            selectedTeam={selectedTeam}
            timeRange={timeRange}
            isLoading={loading}
          />
        </Canvas>
      </div>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={1000} />}
    </>
  )
}
