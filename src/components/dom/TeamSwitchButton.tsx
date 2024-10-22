import { TEAMS, TILE_REGISTRY } from '@/constants'
import FlipIcon from './FlipIcon'
import { useState } from 'react'
import FlippyFaceIcon from './FlippyFaceIcon'

const TeamSwitchButton = ({ className, selectedTeam, setSelectedTeam }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [rotationDegrees, setRotationDegrees] = useState(0)

  const handleClick = () => {
    setRotationDegrees((prev) => prev + 360)
    setSelectedTeam((prevTeam) => (prevTeam + 1) % Object.keys(TEAMS).length)
  }

  const teamColor = TILE_REGISTRY[TEAMS[selectedTeam]]

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-16 h-16 flex justify-center items-center
        rounded-full bg-gradient-to-b
        transition-all duration-500 ease-in-out
        ${isHovered ? 'shadow-lg scale-105' : 'shadow-md scale-100'}
        ${className}
      `}
      style={{
        backdropFilter: 'blur(5.575680255889893px)',
        // boxShadow: '0px 2.788px 67.837px 0px #000',
        background: `linear-gradient(to bottom, ${teamColor.background}, ${teamColor.border})`,
      }}
    >
      <div
        className='w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300'
        style={{
          border: `1px dashed ${teamColor.face}`,
        }}
      >
        <div
          className='transition-all ease-in-out'
          style={{
            transitionDuration: '350ms',
            transform: `rotate(${rotationDegrees}deg)`,
            color: teamColor.side,
          }}
        >
          <FlippyFaceIcon selectedTeam={selectedTeam} />
        </div>
      </div>
    </button>
  )
}

export default TeamSwitchButton
