import React from 'react'

import Dialog from './Dialog'
import OutlineButton from './OrangeButton'
import TeamSelector from './TeamSelector'
import { TEAMS, TILE_REGISTRY } from '@/constants'
import { formatEta } from '@/utils'

interface IntroDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTeam: number
  setSelectedTeam: (team: number) => void
  startTime: number
}

const IntroDialog: React.FC<IntroDialogProps> = ({ isOpen, onClose, selectedTeam, setSelectedTeam, startTime }) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (Date.now() / 1000 > startTime) {
          onClose()
        }
      }}
      color={TILE_REGISTRY[TEAMS[selectedTeam]].border}
    >
      <div className='flex flex-col w-full h-full gap-4 justify-between items-start pointer-events-auto'>
        <h1 className='text-2xl font-bold flex flex-row items-center gap-2'>Welcome to FlippyFlop!</h1>

        <div className='flex flex-col gap-6 mt-2'>
          <div className='flex gap-4 items-start'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center text-xl bg-opacity-20'
              style={{ backgroundColor: TILE_REGISTRY[TEAMS[selectedTeam]].border }}
            >
              1
            </div>
            <div className='flex-1'>
              <h3 className='font-bold mb-1'>Choose your team</h3>
              <p className='text-sm opacity-80'>
                Select a team you prefer or join forces with your community. Each team has its unique color and style!
              </p>
              <div className='flex mt-4'>
                <TeamSelector
                  className='flex justify-center'
                  selectedTeam={selectedTeam}
                  setSelectedTeam={setSelectedTeam}
                />
              </div>
            </div>
          </div>

          <div className='flex gap-4 items-start'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center text-xl bg-opacity-20'
              style={{ backgroundColor: TILE_REGISTRY[TEAMS[selectedTeam]].border }}
            >
              2
            </div>
            <div className='flex-1'>
              <h3 className='font-bold mb-1'>Flip tiles & earn powerups</h3>
              <p className='text-sm opacity-80'>
                Click to flip tiles to your team's color. Look out for special{' '}
                <span
                  className='font-bold animate-pulse'
                  style={{
                    color: TILE_REGISTRY[TEAMS[selectedTeam]].background,
                    textShadow: `0 0 10px ${TILE_REGISTRY[TEAMS[selectedTeam]].background},
                                0 0 20px ${TILE_REGISTRY[TEAMS[selectedTeam]].background},
                                0 0 30px ${TILE_REGISTRY[TEAMS[selectedTeam]].background}`,
                  }}
                >
                  powerup
                </span>{' '}
                tiles that multiply your earnings!
              </p>
            </div>
          </div>

          <div className='flex gap-4 items-start'>
            <div
              className='w-10 h-10 rounded-full flex items-center justify-center text-xl bg-opacity-20'
              style={{ backgroundColor: TILE_REGISTRY[TEAMS[selectedTeam]].border }}
            >
              3
            </div>
            <div className='flex-1'>
              <h3 className='font-bold mb-1'>Claim your $FLIP</h3>
              <p className='text-sm opacity-80'>
                When the game ends, claim your earned $FLIP tokens. The more tiles you control, the more tokens you'll
                receive!
              </p>
            </div>
          </div>
        </div>

        <div className='flex w-full justify-center mt-4'>
          <OutlineButton
            outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
            className='w-fit'
            disabled={Date.now() / 1000 < startTime}
            text={Date.now() / 1000 > startTime ? "Let's Play!" : `Game starts in ${formatEta(startTime)}`}
            onClick={onClose}
          />
        </div>
      </div>
    </Dialog>
  )
}

export default IntroDialog
