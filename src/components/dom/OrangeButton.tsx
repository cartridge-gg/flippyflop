import React from 'react'

interface OrangeButtonProps {
  className?: string
  outline?: string
  icon?: React.ReactNode
  text?: string
  onClick?: () => void
}
const OutlineButton = ({ className, outline = '#F38332', icon, text, onClick }: OrangeButtonProps) => {
  return (
    <button
      className={`
        ${className}
        flex items-center justify-center gap-1 rounded-lg border-2
        px-3 py-2 font-bold backdrop-blur
        transition-all duration-300 ease-in-out
        hover:shadow-lg hover:brightness-110
      `}
      style={{
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.7)',
        background: 'rgba(8, 14, 19, 0.64)',
        borderColor: outline,
        color: outline,
      }}
      onClick={onClick}
    >
      {icon && <span className='transition-transform duration-300 ease-in-out group-hover:scale-105'>{icon}</span>}
      {text && <span className='transition-transform duration-300 ease-in-out group-hover:tracking-wide'>{text}</span>}
    </button>
  )
}

export default OutlineButton
