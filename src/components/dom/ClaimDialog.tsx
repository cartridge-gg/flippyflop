import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useAccount, useProvider } from '@starknet-react/core'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MeshBasicMaterial, SRGBColorSpace, TextureLoader } from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

import Dialog from './Dialog'
import OutlineButton from './OrangeButton'
import TileInstances from '../canvas/InstancedTiles'
import { ACTIONS_ADDRESS, TEAMS, TILE_REGISTRY } from '@/constants'
import { poseidonHash } from '@/libs/dojo.c'
import { Powerup } from '@/models'
import tileShader from '@/shaders/tile.shader'
import { formatE, formatEta, maskAddress, parseError } from '@/utils'

import type { Tile } from '@/models'

interface ClaimDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTeam: number
  timeRange: [number, number]
  claimed: bigint
  userScore: number
  tiles: Record<string, Tile>
}

const ClaimDialog: React.FC<ClaimDialogProps> = ({
  isOpen,
  onClose,
  selectedTeam,
  timeRange,
  claimed,
  userScore,
  tiles,
}) => {
  const { address, account } = useAccount()
  const { provider } = useProvider()
  const [isClaiming, setIsClaiming] = useState(false)
  // const [showSuccess, setShowSuccess] = useState(false)

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

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} color={TILE_REGISTRY[TEAMS[selectedTeam]].border}>
        <div className='flex flex-col w-full h-full gap-2 items-start pointer-events-auto'>
          <div className='flex flex-row w-full justify-between items-center'>
            <h1 className='text-2xl font-bold'>Claim</h1>
            <span className='text-sm opacity-80 animate-pulse'>
              {Date.now() / 1000 < timeRange[0]
                ? `Game starts in ${formatEta(timeRange[0])}*`
                : Date.now() / 1000 > timeRange[1]
                  ? 'Game has ended'
                  : `Game ends in ${formatEta(timeRange[1])}*`}
            </span>
          </div>
          <p className='text-md'>
            A Cartridge Game built with Dojo
            <br />
            <br />
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
          <span className='text-xs opacity-80 mb-2'>
            *Time lock check is done based on block timestamp. You might need to wait a bit after the game ends to
            submit your claim.
          </span>
          <div className='flex flex-row w-full gap-2 justify-center'>
            <OutlineButton
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              className='w-full md:w-1/3'
              text='Close'
              onClick={onClose}
            />
            <OutlineButton
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              className='w-full md:w-1/3'
              text={
                claimed !== BigInt(0) && userScore === 0 && address
                  ? `Claimed ${formatE(claimed)} $FLIP`
                  : `Claim ${userScore} $FLIP`
              }
              disabled={Date.now() / 1000 < timeRange[1] || !address || userScore === 0 || isClaiming}
              onClick={async () => {
                setIsClaiming(true)
                const userTiles = Object.values(tiles)
                  .filter((tile) => tile.address === maskAddress(address))
                  .map((tile) => poseidonHash(['0x' + tile.x.toString(16), '0x' + tile.y.toString(16)]))

                try {
                  // Claim tiles in batches of 1000
                  for (let i = 0; i < userTiles.length; i += 1000) {
                    const batch = userTiles.slice(i, i + 1000)
                    const tx = await account?.execute({
                      contractAddress: ACTIONS_ADDRESS,
                      entrypoint: 'claim',
                      calldata: [batch],
                    })
                    toast(
                      `💰 Processing claim batch ${Math.floor(i / 1000) + 1} with ${Math.ceil(batch.length)} tiles...`,
                    )

                    provider.waitForTransaction(tx.transaction_hash).then((res) => {
                      if (!res.isSuccess()) {
                        toast(`😔 Failed to claim $FLIP: ${parseError(res.value)}`)
                      }
                    })
                  }
                  onClose()
                } catch (e) {
                  toast(`😔 Failed to claim $FLIP: ${parseError(e)}`)
                } finally {
                  setIsClaiming(false)
                }
              }}
            />
          </div>
          <div className='w-full text-center mt-2'>
            <span
              className='text-sm opacity-80 animate-pulse'
              style={{
                color: TILE_REGISTRY[TEAMS[selectedTeam]].background,
                textShadow: `0 0 10px ${TILE_REGISTRY[TEAMS[selectedTeam]].background}`,
              }}
            >
              A Cartridge Game built with Dojo
            </span>
          </div>
        </div>
      </Dialog>

      {/* <ClaimSuccessDialog
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        selectedTeam={selectedTeam}
        claimed={claimed}
        userScore={userScore}
        tiles={tiles}
      /> */}
    </>
  )
}

export default ClaimDialog
