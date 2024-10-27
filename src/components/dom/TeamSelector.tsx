import React, { useState } from 'react'
import { toast } from 'sonner'

import { TEAMS, TILE_REGISTRY } from '@/constants'

interface TeamSelectorProps {
  className: string
  selectedTeam: number
  setSelectedTeam: (team: number) => void
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ className, selectedTeam, setSelectedTeam }) => {
  const [clickedTeam, setClickedTeam] = useState<string | null>(null)

  return (
    <div className={`flex flex-row gap-2 pointer-events-auto ${className}`}>
      {Object.values(TEAMS).map((team, index) => (
        <div
          key={team}
          className={`w-[3vw] h-[3vw] min-w-8 min-h-8 max-w-12 max-h-12 rounded-full 
            ${selectedTeam === index ? 'border-[0.5vw]' : 'border-[0.25vw]'} 
            transition-all duration-300 cursor-pointer
            ${clickedTeam === team ? 'animate-team-click' : 'hover:border-[0.5vw]'}`}
          style={{ backgroundColor: TILE_REGISTRY[team].background, borderColor: TILE_REGISTRY[team].border }}
          onClick={() => {
            setSelectedTeam(index)
            localStorage.setItem('selectedTeam', index.toString())
            toast(
              <div>
                <span>Selected team</span>
                <span className='ml-1' style={{ color: TILE_REGISTRY[team].face }}>
                  {team.charAt(0).toUpperCase() + team.slice(1)} {TILE_REGISTRY[team].emoji}
                </span>
              </div>,
            )

            setClickedTeam(team)
            setTimeout(() => setClickedTeam(null), 300)
          }}
        />
      ))}
    </div>
  )
}

export default TeamSelector
