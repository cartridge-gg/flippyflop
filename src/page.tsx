import { useEffect, useRef, useState } from 'react'
import { NoToneMapping, Scene as ThreeScene, Vector3 } from 'three'
import { Canvas } from '@react-three/fiber'
import { useAccount } from '@starknet-react/core'
import useSound from 'use-sound'
import FlipSound from '@/../public/sfx/flip.mp3'

import { useClient } from '@/hooks/useClient'
import { useTiles } from '@/hooks/useTiles'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useFlip } from '@/hooks/useFlip'
import { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

import Header from '@/components/dom/Header'
import FlipButton from '@/components/dom/FlipButton'
import Scene from '@/components/canvas/Scene'
import { useIndexerUpdate } from './hooks/useIndexerUpdate'
import TeamSwitchButton from './components/dom/TeamSwitchButton'

export default function Page() {
  const { client } = useClient()
  const { tiles, updateTile, loading } = useTiles(client)
  const { address } = useAccount()
  const { leaderboard } = useLeaderboard(tiles)
  const [selectedTeam, setSelectedTeam] = useState<number>(
    localStorage.getItem('selectedTeam') ? parseInt(localStorage.getItem('selectedTeam')!) : 0,
  )

  const camera = useRef()
  const controlsRef = useRef()
  const scene = useRef<ThreeScene>()

  const [playFlipSound] = useSound(FlipSound)
  const { handleFlip } = useFlip({ scene, camera, tiles, updateTile, playFlipSound, controlsRef, selectedTeam })

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
      // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
      // starting from v2 you can add only the features you need reducing the bundle size
      //await loadAll(engine);
      //await loadFull(engine);
      await loadSlim(engine)
      //await loadBasic(engine);
    })
  }, [])

  const { tps } = useIndexerUpdate(client)

  return (
    <>
      <Header
        tiles={tiles}
        tps={tps}
        leaderboard={leaderboard}
        isLoading={loading}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
      />

      <div className='fixed flex flex-row gap-2 w-[100vw] bottom-6 left-1/2 z-20 -translate-x-1/2 justify-center'>
        <FlipButton className='' onClick={handleFlip} isLoading={loading} selectedTeam={selectedTeam} />
        <TeamSwitchButton className={'lg:hidden'} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
      </div>
      <div className='h-screen w-screen'>
        <Canvas gl={{ toneMapping: NoToneMapping }}>
          <Scene
            sceneRef={scene}
            tiles={tiles}
            cameraRef={camera}
            updateTile={updateTile}
            playFlipSound={playFlipSound}
            controlsRef={controlsRef}
            selectedTeam={selectedTeam}
          />
        </Canvas>
      </div>
    </>
  )
}
