import React from 'react'

const OrangeButton = ({ icon, text }) => {
  return (
    <button
      className={`
        flex px-2 py-3 justify-center items-center gap-1 rounded-lg 
        border-2 border-[#F38332] backdrop-blur font-bold text-[#F38332]
        transition-all duration-300 ease-in-out
        hover:brightness-110 hover:shadow-lg
      `}
      style={{
        boxShadow: '0px 4px 4px 0px #000',
        background: 'rgba(8, 14, 19, 0.64)',
      }}
    >
      <span className='transition-transform duration-300 ease-in-out group-hover:scale-105'>{icon}</span>
      <span className='transition-all duration-300 ease-in-out group-hover:tracking-wide'>{text}</span>
    </button>
  )
}

export default OrangeButton
