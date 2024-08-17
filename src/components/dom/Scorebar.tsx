import React from 'react'

const UserIcon = () => (
  <svg width='24' height='25' viewBox='0 0 24 25' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M12 12.5C13.0609 12.5 14.0783 12.0786 14.8284 11.3284C15.5786 10.5783 16 9.56087 16 8.5C16 7.43913 15.5786 6.42172 14.8284 5.67157C14.0783 4.92143 13.0609 4.5 12 4.5C10.9391 4.5 9.92172 4.92143 9.17157 5.67157C8.42143 6.42172 8 7.43913 8 8.5C8 9.56087 8.42143 10.5783 9.17157 11.3284C9.92172 12.0786 10.9391 12.5 12 12.5ZM10.5719 14C7.49375 14 5 16.4937 5 19.5719C5 20.0844 5.41563 20.5 5.92813 20.5H18.0719C18.5844 20.5 19 20.0844 19 19.5719C19 16.4937 16.5063 14 13.4281 14H10.5719Z'
      fill='white'
    />
  </svg>
)

const RobotIcon = () => (
  <svg width='24' height='25' viewBox='0 0 24 25' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M12.9 5.2998V6.1998V7.9998H18.3V19.6998H5.7V7.9998H11.1V6.1998V5.2998H12.9ZM8.85 16.0998H8.4V16.9998H8.85H9.75H10.2V16.0998H9.75H8.85ZM11.55 16.0998H11.1V16.9998H11.55H12.45H12.9V16.0998H12.45H11.55ZM14.25 16.0998H13.8V16.9998H14.25H15.15H15.6V16.0998H15.15H14.25ZM10.425 12.4998C10.425 12.2014 10.3065 11.9153 10.0955 11.7043C9.88452 11.4933 9.59837 11.3748 9.3 11.3748C9.00163 11.3748 8.71548 11.4933 8.5045 11.7043C8.29353 11.9153 8.175 12.2014 8.175 12.4998C8.175 12.7982 8.29353 13.0843 8.5045 13.2953C8.71548 13.5063 9.00163 13.6248 9.3 13.6248C9.59837 13.6248 9.88452 13.5063 10.0955 13.2953C10.3065 13.0843 10.425 12.7982 10.425 12.4998ZM14.7 13.6248C14.9984 13.6248 15.2845 13.5063 15.4955 13.2953C15.7065 13.0843 15.825 12.7982 15.825 12.4998C15.825 12.2014 15.7065 11.9153 15.4955 11.7043C15.2845 11.4933 14.9984 11.3748 14.7 11.3748C14.4016 11.3748 14.1155 11.4933 13.9045 11.7043C13.6935 11.9153 13.575 12.2014 13.575 12.4998C13.575 12.7982 13.6935 13.0843 13.9045 13.2953C14.1155 13.5063 14.4016 13.6248 14.7 13.6248ZM4.8 11.5998V16.9998H3V11.5998H4.8ZM21 11.5998V16.9998H19.2V11.5998H21Z'
      fill='white'
    />
  </svg>
)

const Scorebar = ({ humansScore, botsScore, className }) => {
  const totalScore = humansScore + botsScore
  const humansPercentage = (humansScore / totalScore) * 100
  const botsPercentage = (botsScore / totalScore) * 100

  return (
    <div
      className={`${className} w-full flex justify-center items-center gap-2 p-2 rounded-lg bg-[#080E13A3] backdrop-blur`}
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
