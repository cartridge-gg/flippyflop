import React, { useState, useEffect, useMemo } from 'react'
import RobotIcon from './RobotIcon'
import UserIcon from './UserIcon'
import NumberTicker from './NumberTicker'
import { Powerup, Tile } from '@/models'
import { TEAMS, TILE_REGISTRY, WORLD_SIZE } from '@/constants'

const Scorebar = ({
  scores,
  className,
  selectedTeam,
}: {
  scores: Record<string, number>
  className: string
  selectedTeam: number
}) => {
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
  const botsScore = WORLD_SIZE * WORLD_SIZE - totalScore

  return (
    <div
      className={`${className} w-full flex justify-center items-center gap-2 px-2 py-1 rounded-lg bg-[#080e1386] backdrop-blur text-white`}
      style={{
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.5)',
      }}
    >
      <UserIcon />
      <span className='text-white -ml-1 text-right transition-all duration-300 ease-in-out'>
        <NumberTicker value={totalScore} />
      </span>
      <div className='w-4 h-4 rounded-full' style={{ backgroundColor: TILE_REGISTRY[TEAMS[selectedTeam]].border }} />
      <span className='text-white -ml-1 text-right transition-all duration-300 ease-in-out'>
        <NumberTicker value={scores[TEAMS[selectedTeam]]} />
      </span>
      <div className='flex w-full h-4 gap-1 rounded-sm overflow-hidden'>
        <div className='flex w-full'>
          {Object.entries(scores).map(([team, score]) => (
            <div
              key={team}
              className='h-full transition-all duration-1000 ease-in-out'
              style={{
                width: `${(score / totalScore) * 100}%`,
                backgroundColor: TILE_REGISTRY[team].background,
              }}
            ></div>
          ))}
        </div>
        <div
          className='bg-[#52585e45] h-full rounded-sm transition-all duration-1000 ease-in-out'
          style={{ width: `${botsScore / totalScore}%` }}
        ></div>
      </div>
      <span className='text-white transition-all duration-300 ease-in-out'>
        <NumberTicker value={botsScore} />
      </span>
      <RobotIcon />
    </div>
  )
}

export default Scorebar
