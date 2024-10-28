import React, { useMemo } from 'react'
import { toast } from 'sonner'

import Dialog from './Dialog'
import OutlineButton from './OrangeButton'
import { TEAMS, TILE_REGISTRY } from '@/constants'

import type { Tile } from '@/models'

interface MilestoneDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTeam: number
  milestone: number
  userScore: number
  flippedTiles: Tile[]
}

const getMilestoneText = (milestone: number): string => {
  switch (milestone) {
    case 100:
      return 'Baby flipper 🐣'
    case 500:
      return 'Flip guy 🕴️'
    case 1000:
      return 'Sensei flipper 🧑‍🏫'
    case 2000:
      return 'Flip Go Brrrrrrr 🖨️'
    case 5000:
      return 'Gigachad Flipper 💪'
    default:
      return 'Achievement Unlocked! 🎉'
  }
}

const MilestoneDialog: React.FC<MilestoneDialogProps> = ({
  isOpen,
  onClose,
  selectedTeam,
  milestone,
  userScore,
  flippedTiles,
}) => {
  const message = `I just flipped my ${milestone}th tile on flippyflop.gg as part of the ${
    TEAMS[selectedTeam].substring(0, 1).toUpperCase() + TEAMS[selectedTeam].substring(1)
  } team! 🎮`

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
    window.open(twitterUrl, '_blank')
  }

  const copyMessage = () => {
    navigator.clipboard.writeText(message)
    toast('📋 Message copied to clipboard!')
  }

  const powerups = useMemo(() => {
    return Object.values(flippedTiles).filter((tile) => tile.powerup)
  }, [flippedTiles])

  const MILESTONES = [100, 500, 1000, 2000, 5000]
  const nextMilestone = MILESTONES.find((m) => m > milestone) || null

  return (
    <Dialog isOpen={isOpen} onClose={onClose} color={TILE_REGISTRY[TEAMS[selectedTeam]].border}>
      <div className='flex flex-col w-full gap-6 items-center pointer-events-auto p-4'>
        <h1 className='text-2xl font-bold'>{getMilestoneText(milestone)}</h1>

        <div className='text-center space-y-4'>
          <p className='text-xl'>
            You've flipped{' '}
            <span style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>{milestone} tiles</span>!
          </p>

          <div className='grid grid-cols-2 gap-4 p-4 rounded-lg bg-black/20'>
            <div className='text-center'>
              <p className='text-sm opacity-80'>Current score</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {userScore}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm opacity-80'>Flipped tiles</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {flippedTiles.length}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm opacity-80'>Powerups</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {powerups.length}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm opacity-80'>Team</p>
              <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                {TEAMS[selectedTeam].substring(0, 1).toUpperCase() + TEAMS[selectedTeam].substring(1)}{' '}
                {TILE_REGISTRY[TEAMS[selectedTeam]].emoji}
              </p>
            </div>
            {nextMilestone && (
              <div className='text-center col-span-2'>
                <p className='text-sm opacity-80'>Next Milestone</p>
                <p className='text-lg font-bold' style={{ color: TILE_REGISTRY[TEAMS[selectedTeam]].background }}>
                  {nextMilestone} tiles ({nextMilestone - flippedTiles.length} to go!)
                </p>
              </div>
            )}
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
            text='Copy message'
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

export default MilestoneDialog
