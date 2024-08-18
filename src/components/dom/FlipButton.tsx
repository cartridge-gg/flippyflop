import React, { useState } from 'react'
import FlipIcon from './FlipIcon'
import localFont from 'next/font/local'

const saladDays = localFont({
  src: './../../../public/fonts/SaladDaysRegular.woff',
})

const FlipTileButton = ({ onClick, className }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={className}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          gap-px-10 text-4xl flex justify-center items-center gap-3 px-8 py-2 
          bg-emerald-400 text-black rounded-full hover:bg-emerald-500 
          transition-all duration-300 ease-in-out
          ${isHovered ? 'shadow-lg scale-105' : 'shadow-md scale-100'}
        `}
        style={{
          backdropFilter: 'blur(5.575680255889893px)',
        }}
      >
        <div className={`transition-transform duration-300 ease-in-out ${isHovered ? 'rotate-180' : 'rotate-0'}`}>
          <FlipIcon className='' />
        </div>
        <span className={`${saladDays.className} mt-2`}>Flip tile</span>
      </button>
    </div>
  )
}

export default FlipTileButton
