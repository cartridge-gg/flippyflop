import React from 'react'
import FlipIcon from './FlipIcon'
import localFont from 'next/font/local'

const saladDays = localFont({
  src: './../../../public/fonts/SaladDaysRegular.woff',
})

const FlipTileButton = ({ onClick, className }) => {
  return (
    <div className={className}>
      <button
        onClick={onClick}
        className='gap-px-10 text-4xl flex justify-center items-center gap-3 px-8 py-2 bg-emerald-400 text-black rounded-full hover:bg-emerald-500 transition-colors'
        style={{
          boxShadow: '0px 2.788px 67.837px 0px #000',
          backdropFilter: 'blur(5.575680255889893px)',
        }}
      >
        <FlipIcon className='' />
        <span className={`${saladDays.className} mt-2`}>Flip tile</span>
      </button>
    </div>
  )
}

export default FlipTileButton
