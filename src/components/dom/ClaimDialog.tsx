import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useAccount, useProvider } from '@starknet-react/core'
import React, { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MeshBasicMaterial, SRGBColorSpace, TextureLoader } from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

import Dialog from './Dialog'
import OutlineButton from './OrangeButton'
import TileInstances from '../canvas/InstancedTiles'
import { ACTIONS_ADDRESS, FLIP_ADDRESS, TEAMS, TILE_REGISTRY, WORLD_SIZE } from '@/constants'
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
  balance: bigint
  userScore: number
  tiles: Record<string, Tile>
}

const isValidAmount = (amount: string, maxAmount: bigint): boolean => {
  try {
    // Handle empty or invalid input
    if (!amount || isNaN(Number(amount))) return false

    // Split into integer and decimal parts
    const parts = amount.split('.')
    const integer = parts[0] || '0'
    const decimal = parts[1] || '0'

    // Pad or truncate decimal to 18 places
    const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18)

    // Combine as string and convert to BigInt
    const value = BigInt(integer + paddedDecimal)

    return value > 0 && value <= maxAmount
  } catch {
    return false
  }
}

const isValidAddress = (address: string): boolean => {
  return address.startsWith('0x') && address.length === 66
}

const ClaimDialog: React.FC<ClaimDialogProps> = ({
  isOpen,
  onClose,
  selectedTeam,
  timeRange,
  claimed,
  balance,
  userScore,
  tiles,
}) => {
  const { address, account } = useAccount()
  const { provider } = useProvider()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const claimedTilesCount = useMemo(() => {
    return WORLD_SIZE * WORLD_SIZE - Object.values(tiles).filter((tile) => tile.address !== '0x0').length
  }, [tiles])

  const textures = useMemo(() => {
    const loader = new TextureLoader()
    const loadTexture = (url: string) => {
      const tex = loader.load(url)
      tex.colorSpace = SRGBColorSpace
      return tex
    }

    return {
      robot: loadTexture(TILE_REGISTRY.robot.texture),
      textureAtlas: loadTexture('/textures/Flippyflop_Textures.png'),
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
        textureAtlas: { value: textures.textureAtlas },
        time: { value: 0 },
      },
      transparent: true,
    })
  }, [textures])

  const toETH = (wei: bigint) => {
    return Math.floor(Number(wei) / 1e18).toString()
  }

  const toWEI = (eth: string) => {
    // Convert to wei (18 decimals)
    const parts = eth.split('.')
    const integer = parts[0] || '0'
    const decimal = (parts[1] || '').padEnd(18, '0').slice(0, 18)

    // Format as u256 (two felt252 values - low and high)
    const weiValue = BigInt(integer + decimal)
    const low = '0x' + (weiValue & BigInt('0xffffffffffffffffffffffffffffffff')).toString(16)
    const high = '0x' + (weiValue >> BigInt(128)).toString(16)

    return [low, high]
  }

  const shareOnTwitter = useCallback(() => {
    const tweetText = encodeURIComponent(
      `I just helped Starknet achieve 847 TPS by helping the humans win and claimed ${toETH(claimed)} $FLIP! 🎮`,
    )
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
  }, [claimed])

  return (
    <Dialog isOpen={isOpen} onClose={onClose} color={TILE_REGISTRY[TEAMS[selectedTeam]].border}>
      <div className='flex flex-col w-full h-full gap-2 items-start pointer-events-auto'>
        <div className='flex flex-row w-full justify-between items-center'>
          <h1 className='text-2xl font-bold'>{showWithdraw ? 'Withdraw' : 'Claim'}</h1>
          <div className='flex flex-col items-end'>
            <span className='text-sm opacity-80 animate-pulse'>
              {showWithdraw
                ? `Available: ${formatE(balance)} $FLIP`
                : Date.now() / 1000 < timeRange[0]
                  ? `Game starts in ${formatEta(timeRange[0])}*`
                  : Date.now() / 1000 > timeRange[1]
                    ? 'Game has ended'
                    : `Game ends in ${formatEta(timeRange[1])}*`}
            </span>
            <span className='text-xs opacity-60'>
              {claimedTilesCount} / {WORLD_SIZE * WORLD_SIZE} tiles claimed
            </span>
          </div>
        </div>

        {showWithdraw ? (
          // Withdraw View
          <>
            <p className='text-md'>
              Enter the recipient address and amount of $FLIP tokens you want to withdraw. Make sure the address is
              correct before proceeding.{' '}
            </p>
            <span className='text-xs opacity-80 mb-2 text-orange-200'>
              Note: Your claimed funds are already in your controller account and usable. You do need to withdraw to use
              them. However, you can still withdraw them to another wallet if you wish
            </span>
            <div className='flex flex-col w-full gap-4'>
              <input
                type='text'
                placeholder='Recipient Address (0x + 64 characters)'
                className={`w-full p-2 bg-black/20 border ${
                  recipientAddress && !isValidAddress(recipientAddress) ? 'border-red-500' : 'border-white/20'
                } rounded-md`}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
              {recipientAddress && !isValidAddress(recipientAddress) && (
                <span className='text-red-500 text-sm'>Address must start with 0x and be 66 characters long</span>
              )}
              <div className='flex flex-row gap-2 items-center'>
                <input
                  type='text'
                  placeholder='Amount'
                  className='flex-1 p-2 bg-black/20 border border-white/20 rounded-md'
                  value={withdrawAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    if ((value.match(/\./g) || []).length <= 1) {
                      const parts = value.split('.')
                      if (parts[1]?.length > 18) return
                      setWithdrawAmount(value)
                    }
                  }}
                />
                <OutlineButton
                  outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                  className='whitespace-nowrap'
                  text='Max'
                  onClick={() => setWithdrawAmount(toETH(balance))}
                />
              </div>
            </div>
            <div className='h-full' />
            <div className='flex flex-row w-full gap-2 justify-center'>
              <OutlineButton
                outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                className='w-full md:w-1/3'
                text='Back'
                onClick={() => {
                  setShowWithdraw(false)
                  setWithdrawAmount('')
                  setRecipientAddress('')
                }}
              />
              <OutlineButton
                outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                className='w-full md:w-1/3'
                text={isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                disabled={
                  !isValidAddress(recipientAddress) ||
                  !isValidAmount(withdrawAmount, balance) ||
                  isWithdrawing ||
                  balance === BigInt(0)
                }
                onClick={async () => {
                  setIsWithdrawing(true)
                  try {
                    const tx = await account?.execute({
                      contractAddress: FLIP_ADDRESS,
                      entrypoint: 'transfer',
                      calldata: [recipientAddress, ...toWEI(withdrawAmount)],
                    })
                    toast('💸 Processing withdrawal...')

                    provider.waitForTransaction(tx.transaction_hash).then((res) => {
                      if (!res.isSuccess()) {
                        toast(`😔 Failed to withdraw: ${parseError(res.value)}`)
                      } else {
                        toast('✅ Withdrawal successful!')
                        onClose()
                      }
                    })
                  } catch (e) {
                    toast(`😔 Failed to withdraw: ${parseError(e)}`)
                  } finally {
                    setIsWithdrawing(false)
                  }
                }}
              />
            </div>
          </>
        ) : (
          // Claim View (existing content)
          <>
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
                        {
                          address: '0x1',
                          x: 0,
                          y: 0,
                          team: selectedTeam,
                          powerup: Powerup.Multiplier,
                          powerupValue: 1,
                        },
                        { address: '0x2', x: 0.9, y: 0, team: selectedTeam, powerup: Powerup.None, powerupValue: 0 },
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
            <span className='text-xs opacity-80 mb-2 text-orange-200'>
              Note: If you are experiencing any issues with claiming, please try refreshing the page and trying again.
            </span>
            <span className='text-xs opacity-80 mb-2 text-orange-200'>
              Note: Make sure to fund your wallet with funds before claiming. It costs around 50 cents per 1000 tiles to
              claim.
            </span>
            <div className='flex flex-row w-full gap-2 justify-center'>
              <OutlineButton
                outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                className='w-full md:w-1/3'
                text='Close'
                onClick={onClose}
              />
              {balance > BigInt(0) && claimed > userScore ? (
                <OutlineButton
                  outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                  className='w-full md:w-1/3'
                  text={`Withdraw ${formatE(balance)} $FLIP`}
                  onClick={() => setShowWithdraw(true)}
                />
              ) : (
                <OutlineButton
                  outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                  className='w-full md:w-1/3'
                  text={`Claim ${userScore} $FLIP`}
                  disabled={Date.now() / 1000 < timeRange[1] || !address || userScore === 0 || isClaiming}
                  onClick={async () => {
                    setIsClaiming(true)
                    const userTiles = Object.values(tiles)
                      .filter((tile) => tile.address === maskAddress(address))
                      .map((tile) => poseidonHash(['0x' + tile.x.toString(16), '0x' + tile.y.toString(16)]))

                    try {
                      // Claim tiles in batches of 1000
                      for (let i = 0; i < userTiles.length; i += 990) {
                        const batch = userTiles.slice(i, i + 990)
                        const tx = await account?.execute({
                          contractAddress: ACTIONS_ADDRESS,
                          entrypoint: 'claim',
                          calldata: [batch],
                        })
                        toast(
                          `💰 Processing claim batch ${Math.floor(i / 990) + 1} with ${Math.ceil(batch.length)} tiles...`,
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
              )}
              {claimed > BigInt(0) && userScore === 0 && (
                <OutlineButton
                  outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                  className='w-full md:w-1/3'
                  text='Share on Twitter 🐦'
                  onClick={shareOnTwitter}
                />
              )}
            </div>
          </>
        )}

        <div className='w-full text-center mt-2'>
          <span
            className='text-md opacity-80 animate-pulse'
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
  )
}

export default ClaimDialog
