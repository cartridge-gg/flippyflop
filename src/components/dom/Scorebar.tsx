import React from 'react'

import LockIcon from './LockIcon'
import NumberTicker from './NumberTicker'
import RobotIcon from './RobotIcon'
import UserIcon from './UserIcon'
import { TEAMS, TILE_REGISTRY, WORLD_SIZE } from '@/constants'

const Scorebar = ({
  scores,
  className,
  selectedTeam,
  onClick,
  lockedTiles,
}: {
  scores: Record<string, number>
  className: string
  selectedTeam: number
  onClick?: () => void
  lockedTiles: number
}) => {
  const totalScore = WORLD_SIZE * WORLD_SIZE
  const humansScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
  const botsScore = totalScore - humansScore

  return (
    <div
      className={`${className} flex flex-col md:flex-row w-full items-center gap-2 px-2 py-1 rounded-lg bg-[#080e1386] backdrop-blur text-white`}
      style={{ boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.5)' }}
      onClick={onClick}
    >
      <div className='flex mt-1 md:mt-0 w-full order-1 md:order-2 h-4 gap-1 rounded-sm overflow-hidden'>
        {Object.entries(scores).map(([team, score], index, array) => (
          <div
            key={team}
            className={`h-full transition-all duration-1000 -ml-1 ease-in-out ${
              index === array.length - 1 ? 'rounded-r-sm' : ''
            }`}
            style={{
              width: `${(score / totalScore) * 100}%`,
              backgroundColor: TILE_REGISTRY[team].background,
            }}
          />
        ))}
        <div
          className='bg-[#52585e45] h-full rounded-sm transition-all duration-1000 ease-in-out'
          style={{ width: `${(botsScore / totalScore) * 100}%` }}
        />
      </div>

      <div className='flex w-full md:w-auto order-2 md:order-1 justify-between md:justify-start items-center gap-2'>
        <div className='flex gap-2 items-center'>
          <LockIcon />
          <span className='text-white transition-all duration-300 ease-in-out'>
            <NumberTicker value={lockedTiles} />
          </span>
          <UserIcon />
          <span className='text-white text-right transition-all duration-300 ease-in-out'>
            <NumberTicker value={humansScore} />
          </span>
          <div
            className='w-4 h-4 rounded-full'
            style={{ backgroundColor: TILE_REGISTRY[TEAMS[selectedTeam]].border }}
          />
          <span className='flex flex-row text-white text-right transition-all duration-300 ease-in-out'>
            <NumberTicker value={scores[TEAMS[selectedTeam]]} />
          </span>
        </div>
        <div className='flex md:hidden gap-2 items-center'>
          <span className='text-white transition-all duration-300 ease-in-out'>
            <NumberTicker value={botsScore} />
          </span>
          <RobotIcon />
        </div>
      </div>

      <div className='hidden md:flex w-auto order-3 justify-end items-center gap-2'>
        <span className='text-white transition-all duration-300 ease-in-out'>
          <NumberTicker value={botsScore} />
        </span>
        <RobotIcon />
      </div>
    </div>
  )
}

export default Scorebar
