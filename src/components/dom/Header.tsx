import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useConnect, useDisconnect, useAccount } from '@starknet-react/core'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { TextureLoader, SRGBColorSpace, MeshBasicMaterial } from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import humanizeDuration from 'humanize-duration'

import CoinsIcon from './CoinsIcon'
import Dialog from './Dialog'
import TPS from './TPS'
import TileInstances from '../canvas/InstancedTiles'
import CopyIcon from '@/components/dom/CopyIcon'
import FlippyFlop from '@/components/dom/FlippyFlop'
import FlippyFlopIcon from '@/components/dom/FlippyFlopIcon'
import Leaderboard from '@/components/dom/Leaderboard'
import OutlineButton from '@/components/dom/OrangeButton'
import Scorebar from '@/components/dom/Scorebar'
import UserIcon from '@/components/dom/UserIcon'
import { ACTIONS_ADDRESS, TEAMS, TILE_REGISTRY } from '@/constants'
import { useUsernames } from '@/contexts/UsernamesContext'
import { Powerup } from '@/models'
import tileShader from '@/shaders/tile.shader'
import { maskAddress } from '@/utils'

import type { Tile } from '@/models'
import { poseidonHash } from '@/libs/dojo.c'

interface HeaderProps {
  tiles: Record<string, Tile>
  tps: number
  leaderboard: any[]
  isLoading: boolean
  selectedTeam: number
  setSelectedTeam: (team: number) => void
  lockedAt: number
}

const TeamSelector = ({ className, selectedTeam, setSelectedTeam }) => {
  const [clickedTeam, setClickedTeam] = useState<string | null>(null)

  return (
    <div className={`flex flex-row gap-2 pointer-events-auto ${className}`}>
      {Object.values(TEAMS).map((team, index) => (
        <div
          key={team}
          className={`w-[3vw] h-[3vw] min-w-8 min-h-8 max-w-12 max-h-12 rounded-full 
            ${selectedTeam === index ? 'border-[0.5vw]' : 'border-[0.25vw]'} 
            transition-all duration-300 cursor-pointer
            ${clickedTeam === team ? 'animate-team-click' : 'hover:border-[0.5vw]'}`}
          style={{ backgroundColor: TILE_REGISTRY[team].background, borderColor: TILE_REGISTRY[team].border }}
          onClick={() => {
            setSelectedTeam(index)
            localStorage.setItem('selectedTeam', index.toString())
            toast(
              <div>
                <span>Selected team</span>
                <span className='ml-1' style={{ color: TILE_REGISTRY[team].face }}>
                  {team.charAt(0).toUpperCase() + team.slice(1)} {TILE_REGISTRY[team].emoji}
                </span>
              </div>,
            )

            setClickedTeam(team)
            setTimeout(() => setClickedTeam(null), 300)
          }}
        />
      ))}
    </div>
  )
}

const Header: React.FC<HeaderProps> = ({
  tiles,
  tps,
  leaderboard,
  isLoading,
  selectedTeam,
  setSelectedTeam,
  lockedAt,
}) => {
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { account, status, address } = useAccount()
  const { usernamesCache } = useUsernames()
  const cartridgeConnector = connectors[0]

  const userScore = Object.values(tiles)
    .filter((tile) => tile.address === (address ? maskAddress(address) : undefined))
    .reduce((score, tile) => {
      return score + (tile.powerup === Powerup.Multiplier ? tile.powerupValue : 1)
    }, 0)

  const [leaderboardOpenedMobile, setLeaderboardOpenedMobile] = useState(false)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [clickedTeam, setClickedTeam] = useState<string | null>(null)

  const textures = useMemo(() => {
    const loader = new TextureLoader()
    const loadTexture = (url: string) => {
      const tex = loader.load(url)
      tex.colorSpace = SRGBColorSpace
      return tex
    }

    return {
      robot: loadTexture(TILE_REGISTRY.robot.texture),
      orange: loadTexture(TILE_REGISTRY.orange.texture),
      green: loadTexture(TILE_REGISTRY.green.texture),
      red: loadTexture(TILE_REGISTRY.red.texture),
      blue: loadTexture(TILE_REGISTRY.blue.texture),
      pink: loadTexture(TILE_REGISTRY.pink.texture),
      purple: loadTexture(TILE_REGISTRY.purple.texture),
      bonusOrange: loadTexture(TILE_REGISTRY.orange.bonusTexture),
      bonusGreen: loadTexture(TILE_REGISTRY.green.bonusTexture),
      bonusRed: loadTexture(TILE_REGISTRY.red.bonusTexture),
      bonusBlue: loadTexture(TILE_REGISTRY.blue.bonusTexture),
      bonusPink: loadTexture(TILE_REGISTRY.pink.bonusTexture),
      bonusPurple: loadTexture(TILE_REGISTRY.purple.bonusTexture),
    }
  }, [])

  const robotMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        transparent: true,
        map: textures.robot,
      }),
    [textures.robot],
  )
  const material = useMemo(() => {
    const baseMaterial = new MeshBasicMaterial({
      transparent: true,
    })
    return new CustomShaderMaterial({
      baseMaterial,
      vertexShader: tileShader.vertex,
      fragmentShader: tileShader.fragment,
      uniforms: {
        robotTexture: { value: textures.robot },
        orangeTexture: { value: textures.orange },
        greenTexture: { value: textures.green },
        redTexture: { value: textures.red },
        blueTexture: { value: textures.blue },
        pinkTexture: { value: textures.pink },
        purpleTexture: { value: textures.purple },
        bonusOrangeTexture: { value: textures.bonusOrange },
        bonusGreenTexture: { value: textures.bonusGreen },
        bonusRedTexture: { value: textures.bonusRed },
        bonusBlueTexture: { value: textures.bonusBlue },
        bonusPinkTexture: { value: textures.bonusPink },
        bonusPurpleTexture: { value: textures.bonusPurple },
        time: { value: 0 },
      },
      transparent: true,
    })
  }, [textures])

  const scores = useMemo(() => {
    const scores = Object.fromEntries(Object.values(TEAMS).map((team) => [team, 0]))

    Object.values(tiles).forEach((tile) => {
      if (tile.address === '0x0') return

      const team = tile.team
      scores[TEAMS[team]] += 1
    })

    return scores
  }, [tiles])

  return (
    <div className='pointer-events-none fixed top-0 z-20 flex w-full flex-col items-start justify-start gap-4 bg-gradient-to-b from-black/70 to-transparent p-4'>
      <div className='flex flex-col-reverse md:flex-row w-full items-start gap-4 md:gap-12'>
        <div className='flex w-full flex-col justify-between gap-4'>
          <div className='hidden md:flex flex-row gap-8 items-center'>
            <FlippyFlop className='' selectedTeam={selectedTeam} />
            <TPS tps={tps} />
            <TeamSelector className='hidden lg:flex' selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
          </div>
          <Scorebar
            className='w-full pointer-events-auto'
            scores={scores}
            selectedTeam={selectedTeam}
            onClick={() => setLeaderboardOpenedMobile((prev) => !prev)}
          />
        </div>
        <div className='flex w-full md:w-2/5 md:max-w-96 flex-col gap-4'>
          <div className='pointer-events-auto flex gap-3'>
            <FlippyFlopIcon className='md:hidden flex-shrink-0' selectedTeam={selectedTeam} />
            <OutlineButton
              className=''
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              icon={<CoinsIcon />}
              text={userScore.toString()}
              onClick={() => {
                setClaimDialogOpen(true)
              }}
            />
            <OutlineButton
              className='w-full'
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              icon={<UserIcon />}
              text={account ? usernamesCache[account.address] : 'Connect'}
              onClick={() => {
                if (account) {
                  disconnect()
                  return
                }
                connect({ connector: cartridgeConnector })
              }}
            />
            {account?.address && (
              <OutlineButton
                icon={<CopyIcon />}
                outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                onClick={() => {
                  if (!account) return
                  navigator.clipboard.writeText('0x' + account.address.slice(2).padStart(64, '0'))
                }}
              />
            )}
          </div>
          <Leaderboard
            className={`${leaderboardOpenedMobile ? '' : 'hidden'} md:flex`}
            scores={leaderboard}
            isLoading={isLoading}
            selectedTeam={selectedTeam}
            teamScores={scores}
            onClose={() => setLeaderboardOpenedMobile(false)}
          />
        </div>
      </div>
      <Dialog
        isOpen={claimDialogOpen}
        onClose={() => setClaimDialogOpen(false)}
        color={TILE_REGISTRY[TEAMS[selectedTeam]].border}
      >
        <div className='flex flex-col w-full h-full gap-2 items-start pointer-events-auto'>
          <div className='flex flex-row w-full justify-between items-center'>
            <h1 className='text-2xl font-bold'>Claim</h1>
            <span className='text-sm opacity-80 animate-pulse'>
              {Date.now() / 1000 > lockedAt
                ? `Game has ended`
                : `Game ends in ${humanizeDuration(lockedAt - Date.now() / 1000, {
                    round: true,
                    largest: lockedAt - Date.now() / 1000 > 24 * 60 * 60 * 1000 ? 1 : 2, // 1 unit if > 1 day, else 2 units
                  })}`}
            </span>
          </div>
          <p className='text-md'>
            During the entire duration of the game, each flipped tile will earn you potential $FLIP tokens. There are
            two types of tiles: Powerup and normal tiles. Powerup tiles are rarer and unflippable, while normal tiles
            can get flipped back by bots. <br />
            <br />
            Once the game is over, you will be able to claim your $FLIP tokens.
          </p>
          <div className='flex flex-row w-full h-full/3 items-center md:px-20'>
            <span
              style={{
                color: TILE_REGISTRY[TEAMS[selectedTeam]].background,
                textShadow: `0 0 10px ${TILE_REGISTRY[TEAMS[selectedTeam]].background},
                            0 0 20px ${TILE_REGISTRY[TEAMS[selectedTeam]].background},
                            0 0 30px ${TILE_REGISTRY[TEAMS[selectedTeam]].background}`,
                animationDuration: '3s',
              }}
              className='text-sm md:text-md flex-1 text-center animate-pulse'
            >
              Earns 2x, 4x, 8x ... 32x $FLIP
            </span>
            <div className='ml-8 flex-1'>
              <Canvas
                gl={{
                  pixelRatio: window.devicePixelRatio,
                }}
                className=''
                style={{ height: '150px', width: '200px' }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 10]} intensity={1} />
                <group rotation={[Math.PI / 3, 0, Math.PI / 8]}>
                  <TileInstances
                    tiles={[
                      { address: '0x1', x: 0, y: 0, team: selectedTeam, powerup: Powerup.Multiplier, powerupValue: 1 },
                      { address: '0x2', x: 0.9, y: 0, team: selectedTeam, powerup: Powerup.None, powerupValue: 1 },
                    ]}
                    position={[-0.6, -0.1, 0]}
                    material={material}
                    robotMaterial={robotMaterial}
                  />
                </group>
                <OrthographicCamera makeDefault zoom={70} position={[0, 0, 0]} near={0} far={100000000} />
                <EffectComposer>
                  <Bloom
                    // blendFunction={10}
                    kernelSize={4}
                    intensity={1.1}
                    luminanceThreshold={0.4}
                    luminanceSmoothing={1.5}
                    resolutionScale={0.1}
                  />
                </EffectComposer>
              </Canvas>
            </div>
            <span className='text-sm md:text-md flex-1 text-center'>
              Earns 1 <span style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>$FLIP</span>
            </span>
          </div>
          <div className='h-full' />
          <div className='flex flex-row w-full gap-2 justify-center'>
            <OutlineButton
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              className='w-full md:w-1/3'
              text='Close'
              onClick={() => setClaimDialogOpen(false)}
            />
            <OutlineButton
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              className='w-full md:w-1/3'
              text={`Claim ${userScore} $FLIP`}
              disabled={Date.now() / 1000 < lockedAt || !address}
              onClick={async () => {
                const userTiles = Object.values(tiles)
                  .filter((tile) => tile.address === maskAddress(address))
                  .map((tile) => poseidonHash(['0x' + tile.x.toString(16), '0x' + tile.y.toString(16)]))
                console.log(userTiles)

                try {
                  await account?.execute({
                    contractAddress: ACTIONS_ADDRESS,
                    entrypoint: 'claim',
                    calldata: [userTiles],
                  })
                  toast(`🎉 Congratulations! You just claimed ${userScore} $FLIP`)
                  setClaimDialogOpen(false)
                } catch (e) {
                  toast(`😔 Failed to claim $FLIP: ${e.message}`)
                }
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default Header
