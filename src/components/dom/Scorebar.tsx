import React from 'react'
import RobotIcon from './RobotIcon'
import UserIcon from './UserIcon'

const Scorebar = ({ humansScore, botsScore, className }) => {
  const totalScore = humansScore + botsScore
  const humansPercentage = (humansScore / totalScore) * 100
  const botsPercentage = (botsScore / totalScore) * 100

  return (
    <div
      className={`${className} w-full flex justify-center items-center gap-2 p-2 rounded-lg bg-[#080E13A3] backdrop-blur text-white`}
    >
      <UserIcon />
      <span className='text-white -ml-1 text-right transition-all duration-300 ease-in-out'>
        {humansScore.toLocaleString()}
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
