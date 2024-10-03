import React, { useMemo } from 'react'
import RobotIcon from './RobotIcon'
import UserIcon from './UserIcon'
import NumberTicker from '../ui/number-ticker'

const Scorebar = ({ humansScore, botsScore, className }) => {
  const totalScore = useMemo(() => humansScore + botsScore, [humansScore, botsScore])
  const humansPercentage = useMemo(() => (humansScore / totalScore) * 100, [humansScore, botsScore, totalScore])
  const botsPercentage = useMemo(() => (botsScore / totalScore) * 100, [humansScore, botsScore, totalScore])

  return (
    <div
      className={`${className} w-full flex justify-center items-center gap-2 p-2 rounded-lg bg-[#080E13A3] backdrop-blur text-white`}
      style={{
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.5)',
      }}
    >
      <UserIcon />
      <span className='text-white -ml-1 text-right transition-all duration-300 ease-in-out'>
        {humansScore > 0 ? <NumberTicker value={humansScore} /> : humansScore}
      </span>
      <div className='flex grow h-4 rounded-sm overflow-hidden gap-1'>
        <div
          className='bg-[#F38332] h-full rounded-sm transition-all duration-300 ease-in-out'
          style={{ width: `${humansPercentage}%` }}
        ></div>
        <div
          className='bg-[#52585E] h-full rounded-sm transition-all duration-300 ease-in-out'
          style={{ width: `${botsPercentage}%` }}
        ></div>
      </div>
      <span className='text-white transition-all duration-300 ease-in-out'>{botsScore.toLocaleString()}</span>
      <RobotIcon />
    </div>
  )
}

export default Scorebar
