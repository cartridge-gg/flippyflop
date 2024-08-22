import React, { useState } from 'react'
import FlipIcon from './FlipIcon'

const FlipTileButton = ({ onClick, className }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={className}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          gap-px-10 text-2xl md:text-3xl flex justify-center items-center gap-2 p-1
        text-black rounded-full from-[#03FFA3] from-0% to-[#02c07a] to-100% bg-gradient-to-b
          hover:brightness-90
          transition-all duration-300 ease-in-out
          ${isHovered ? 'shadow-lg scale-105' : 'shadow-md scale-100'}
        `}
        style={{
          backdropFilter: 'blur(5.575680255889893px)',
          boxShadow: '0px 2.788px 67.837px 0px #000',
          border: '0.5px rgba(255, 255, 255, 0.32)',
        }}
      >
        <div
          className='flex w-full items-center gap-1 px-6 py-2 rounded-full'
          style={{
            border: '1px dashed rgba(0, 0, 0, 0.12)',
          }}
        >
          <div className={`transition-transform duration-300 ease-in-out ${isHovered ? 'rotate-180' : 'rotate-0'}`}>
            <FlipIcon className='w-8 h-8' />
          </div>
          <span
            style={{
              fontFamily: 'SaladDays',
            }}
            className={`mt-2`}
          >
            Flip tile
          </span>
        </div>
      </button>
    </div>
  )
}

export default FlipTileButton
