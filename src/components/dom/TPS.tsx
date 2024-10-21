import React, { useState, useEffect, useRef } from 'react'
import NumberTicker from './NumberTicker'
import { useDebouncedCallback } from 'use-debounce'

const ArrowsIcon = ({ isUp }: { isUp: boolean }) => (
  <svg
    width='25'
    height='25'
    viewBox='0 0 25 25'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    style={{
      transform: isUp ? 'rotate(0deg)' : 'rotate(180deg)',
      transition: 'transform 0.1s ease-in-out',
    }}
  >
    <path
      d='M8.0071 18.1159C7.69073 18.3279 7.2624 18.2433 7.05039 17.9269C6.83839 17.6105 6.92299 17.1822 7.23936 16.9702L12.9336 13.1543L18.6278 16.9702C18.9442 17.1822 19.0288 17.6105 18.8168 17.9269C18.6048 18.2433 18.1765 18.3279 17.8601 18.1159L12.9336 14.8145L8.0071 18.1159Z'
      fill='currentColor'
    >
      <animate attributeName='opacity' values='1;0;1' dur='0.3s' repeatCount='1' begin='0s' />
    </path>
    <path
      d='M8.0071 11.7287C7.69073 11.9407 7.2624 11.8561 7.05039 11.5397C6.83839 11.2234 6.92299 10.795 7.23936 10.583L12.9336 6.76718L18.6278 10.583C18.9442 10.795 19.0288 11.2234 18.8168 11.5397C18.6048 11.8561 18.1765 11.9407 17.8601 11.7287L12.9336 8.42734L8.0071 11.7287Z'
      fill='currentColor'
    >
      <animate attributeName='opacity' values='1;0;1' dur='0.3s' repeatCount='1' begin='0.3s' />
    </path>
  </svg>
)

const TPS = ({ tps }: { tps: number }) => {
  const tpsRef = useRef(tps)
  const prevTpsRef = useRef(tps)
  const zeroCountRef = useRef(0)

  const [displayTps, setDisplayTps] = useState(tps)
  const [isIncreasing, setIsIncreasing] = useState(true)
  const [key, setKey] = useState(0)

  useEffect(() => {
    prevTpsRef.current = tpsRef.current
    tpsRef.current = tps

    if (tps === 0) {
      zeroCountRef.current += 1
    } else {
      zeroCountRef.current = 0
    }
  }, [tps])

  useEffect(() => {
    const interval = setInterval(() => {
      if (zeroCountRef.current >= 3 || tpsRef.current !== 0) {
        setDisplayTps(tpsRef.current)
        setIsIncreasing(tpsRef.current >= prevTpsRef.current)
        setKey((prev) => (tpsRef.current !== prevTpsRef.current ? prev + 1 : prev))
      }
    }, 300)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className='px-3 py-2 bg-[#080E13] bg-opacity-70 backdrop-blur-sm rounded-lg flex flex-row items-center gap-1'
      style={{
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.50)',
        transition: 'color 0.3s ease-in-out',
        color: isIncreasing ? '#93F332' : '#FF4D4D',
      }}
    >
      <ArrowsIcon key={key} isUp={isIncreasing} /> <NumberTicker value={displayTps} /> tps
    </div>
  )
}

export default TPS
