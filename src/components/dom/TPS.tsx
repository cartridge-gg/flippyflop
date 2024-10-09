import React, { useState, useEffect, useCallback } from 'react'

const ArrowsIcon = ({ isUp, color }: { isUp: boolean; color: string }) => (
  <svg
    width='25'
    height='25'
    viewBox='0 0 25 25'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    style={{
      transform: isUp ? 'rotate(0deg)' : 'rotate(180deg)',
      transition: 'transform 0.3s ease-in-out',
    }}
  >
    <path
      d='M8.0071 18.1159C7.69073 18.3279 7.2624 18.2433 7.05039 17.9269C6.83839 17.6105 6.92299 17.1822 7.23936 16.9702L12.9336 13.1543L18.6278 16.9702C18.9442 17.1822 19.0288 17.6105 18.8168 17.9269C18.6048 18.2433 18.1765 18.3279 17.8601 18.1159L12.9336 14.8145L8.0071 18.1159Z'
      fill={color}
    >
      <animate attributeName='opacity' values='1;0;1' dur='0.6s' repeatCount='1' begin='0s' />
    </path>
    <path
      d='M8.0071 11.7287C7.69073 11.9407 7.2624 11.8561 7.05039 11.5397C6.83839 11.2234 6.92299 10.795 7.23936 10.583L12.9336 6.76718L18.6278 10.583C18.9442 10.795 19.0288 11.2234 18.8168 11.5397C18.6048 11.8561 18.1765 11.9407 17.8601 11.7287L12.9336 8.42734L8.0071 11.7287Z'
      fill={color}
    >
      <animate attributeName='opacity' values='1;0;1' dur='0.6s' repeatCount='1' begin='0.3s' />
    </path>
  </svg>
)

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const TPS = ({ tps }: { tps: number }) => {
  const [displayTps, setDisplayTps] = useState(tps)
  const [prevTps, setPrevTps] = useState(tps)
  const [isIncreasing, setIsIncreasing] = useState(true)
  const [color, setColor] = useState('#93F332')
  const [key, setKey] = useState(0)

  const debouncedUpdate = useCallback(
    (newTps: number) => {
      setDisplayTps(newTps)
      setIsIncreasing(newTps >= prevTps)
      setColor(newTps >= prevTps ? '#93F332' : '#FF4D4D')
      setPrevTps(newTps)
      setKey((prev) => prev + 1)
    },
    [prevTps],
  )

  useEffect(() => {
    console.log
    debouncedUpdate(Math.random() > 0.5 ? -1 : 1)
  }, [tps, debouncedUpdate])

  return (
    <div
      className='px-3 py-2 bg-[#080E13] bg-opacity-70 backdrop-blur-sm rounded-lg flex flex-row items-center gap-1'
      style={{
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.50)',
        color: color,
        transition: 'color 0.3s ease-in-out',
      }}
    >
      <ArrowsIcon key={key} isUp={isIncreasing} color={color} /> {displayTps} tps
    </div>
  )
}

export default TPS
