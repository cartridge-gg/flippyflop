import { useAccount } from '@starknet-react/core'
import React, { useMemo } from 'react'
import { toast } from 'sonner'

import Dialog from './Dialog'
import OutlineButton from './OrangeButton'
import { TEAMS, TILE_REGISTRY, WORLD_SIZE } from '@/constants'
import { Powerup, type Tile } from '@/models'
import { formatE, maskAddress } from '@/utils'

interface ClaimSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTeam: number
  claimed: bigint
  userScore: number
  tiles: Record<string, Tile>
}

const ClaimSuccessDialog: React.FC<ClaimSuccessDialogProps> = ({
  isOpen,
  onClose,
  selectedTeam,
  claimed,
  userScore,
  tiles,
}) => {
  const { address } = useAccount()
  const message = `I just claimed ${formatE(claimed)} $FLIP from flippyflop.gg with ${userScore} tiles flipped as part of the ${
    TEAMS[selectedTeam].substring(0, 1).toUpperCase() + TEAMS[selectedTeam].substring(1)
  } team!`

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
    window.open(twitterUrl, '_blank')
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message)
    toast('📋 Message copied to clipboard!')
  }

  const flippedTiles = useMemo(() => {
    return Object.values(tiles).filter((tile) => address && tile.address === maskAddress(address))
  }, [tiles, address])
  const totalTiles = WORLD_SIZE * WORLD_SIZE
  const percentageFlipped = useMemo(() => {
    return ((flippedTiles.length / totalTiles) * 100).toFixed(2)
  }, [flippedTiles, totalTiles])

  const powerupTiles = useMemo(() => {
    return flippedTiles.filter((tile) => tile.powerup !== Powerup.None).length
  }, [flippedTiles])

  return (
    <Dialog isOpen={isOpen} onClose={onClose} color={TILE_REGISTRY[TEAMS[selectedTeam]].border}>
      <div className='flex flex-col w-full gap-6 items-center pointer-events-auto p-4'>
        <h1 className='text-2xl font-bold'>Congratulations! 🎉</h1>

        <div className='text-center space-y-4'>
          <p className='text-xl'>
            You claimed{' '}
            <span style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
              {formatE(claimed).toString()} $FLIP
            </span>
          </p>

          <div className='grid grid-cols-2 gap-4 p-4 rounded-lg bg-black/20'>
            <div className='text-center'>
              <p className='text-sm opacity-80'>Tiles flipped</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {userScore}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm opacity-80'>Coverage</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {percentageFlipped}%
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm opacity-80'>$FLIP per tile</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {(Number(formatE(claimed)) / userScore).toFixed(2)}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm opacity-80'>Team</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {TEAMS[selectedTeam].substring(0, 1).toUpperCase() + TEAMS[selectedTeam].substring(1)}{' '}
                {TILE_REGISTRY[TEAMS[selectedTeam]].emoji}
              </p>
            </div>
            <div className='text-center col-span-2'>
              <p className='text-sm opacity-80'>Powerup tiles</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {powerupTiles} ⚡
              </p>
            </div>
          </div>

          <p className='text-sm opacity-80'>Share your achievement with others!</p>
        </div>

        <div className='flex flex-row w-full h-16 gap-2'>
          <OutlineButton
            outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
            className='w-full'
            text='Share on Twitter'
            onClick={shareOnTwitter}
          />
          <OutlineButton
            outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
            className='w-full'
            text='Copy shareable message'
            onClick={copyMessage}
          />
          <OutlineButton
            outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
            className='w-full'
            text='Close'
            onClick={onClose}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default ClaimSuccessDialog
