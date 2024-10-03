import React, { useState, useEffect } from 'react'
import RobotIcon from './RobotIcon'
import UserIcon from './UserIcon'

const NumberTicker = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const valueDelta = Math.abs(value - displayValue)
    const steps = Math.min(Math.max(Math.ceil(valueDelta / 2), 5), 30)
    const stepValue = (value - displayValue) / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setDisplayValue((prevValue) => {
        const newValue = prevValue + stepValue
        return currentStep === steps ? value : Math.round(newValue)
      })

      if (currentStep === steps) {
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return <span>{displayValue.toLocaleString()}</span>
}

const Scorebar = ({ humansScore, botsScore, className }) => {
  const totalScore = humansScore + botsScore
  const humansPercentage = (humansScore / totalScore) * 100
  const botsPercentage = (botsScore / totalScore) * 100

  return (
    <div
      className={`${className} w-full flex justify-center items-center gap-2 p-2 rounded-lg bg-[#080E13A3] backdrop-blur text-white`}
      style={{
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.5)',
      }}
    >
      <UserIcon />
      <span className='text-white -ml-1 text-right transition-all duration-300 ease-in-out'>
        <NumberTicker value={humansScore} />
      </span>
      <div className='flex grow h-4 rounded-sm overflow-hidden gap-1'>
        <div
          className='bg-[#F38332] h-full rounded-sm transition-all duration-1000 ease-in-out'
          style={{ width: `${humansPercentage}%` }}
        ></div>
        <div
          className='bg-[#52585E] h-full rounded-sm transition-all duration-1000 ease-in-out'
          style={{ width: `${botsPercentage}%` }}
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
