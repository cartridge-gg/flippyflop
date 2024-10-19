import React, { useMemo, useState } from 'react'
import FlippyFlop from '@/components/dom/FlippyFlop'
import Scorebar from '@/components/dom/Scorebar'
import FlippyFlopIcon from '@/components/dom/FlippyFlopIcon'
import OutlineButton from '@/components/dom/OrangeButton'
import UserIcon from '@/components/dom/UserIcon'
import CheckmarkIcon from '@/components/dom/CheckmarkIcon'
import CopyIcon from '@/components/dom/CopyIcon'
import Leaderboard from '@/components/dom/Leaderboard'
import { useConnect, useDisconnect, useAccount } from '@starknet-react/core'
import { useUsernames } from '@/contexts/UsernamesContext'
import CoinsIcon from './CoinsIcon'
import TPS from './TPS'
import { TEAMS, TILE_REGISTRY, WORLD_SIZE } from '@/constants'
import { toast } from 'sonner'
import { Powerup, Tile } from '@/models'
import { maskAddress } from '@/utils'

interface HeaderProps {
  tiles: Record<string, Tile>
  tps: number
  leaderboard: any[]
  isLoading: boolean
  selectedTeam: number
  setSelectedTeam: (team: number) => void
}

const Header: React.FC<HeaderProps> = ({ tiles, tps, leaderboard, isLoading, selectedTeam, setSelectedTeam }) => {
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { account, status, address } = useAccount()
  const { usernamesCache } = useUsernames()
  const cartridgeConnector = connectors[0]

  const userScore = Object.values(tiles)
    .filter((tile) => tile.address === (address ? maskAddress(address) : undefined))
    .reduce((score, tile) => {
      return score + (tile.powerup === Powerup.Multiplier ? tile.powerupValue : 1)
    }, 0)

  const [leaderboardOpenedMobile, setLeaderboardOpenedMobile] = useState(false)
  const [clickedTeam, setClickedTeam] = useState<string | null>(null)

  const scores = useMemo(() => {
    const scores = Object.fromEntries(Object.values(TEAMS).map((team) => [team, 0]))

    Object.values(tiles).forEach((tile) => {
      if (tile.address === '0x0') return

      const team = tile.team
      scores[TEAMS[team]] += 1
    })

    return scores
  }, [tiles])

  return (
    <div className='pointer-events-none fixed top-0 z-20 flex w-full flex-col items-start justify-start gap-4 bg-gradient-to-b from-black/70 to-transparent p-4'>
      <div className='flex flex-col-reverse md:flex-row w-full items-start gap-4 md:gap-12'>
        <div className='flex w-full flex-col justify-between gap-4'>
          <div className='hidden md:flex flex-row gap-8 items-center'>
            <FlippyFlop className='' selectedTeam={selectedTeam} />
            <TPS tps={tps} />
            <div className='flex flex-row gap-2 pointer-events-auto'>
              {Object.values(TEAMS).map((team, index) => (
                <div
                  key={team}
                  className={`w-12 h-12 rounded-full ${selectedTeam === index ? 'border-8' : 'border-4'} transition-all duration-300 cursor-pointer ${
                    clickedTeam === team ? 'animate-team-click' : 'hover:border-8'
                  }`}
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
          </div>
          <Scorebar className={'w-full'} scores={scores} selectedTeam={selectedTeam} />
        </div>
        <div className='flex w-full md:w-2/5 flex-col gap-4'>
          <div className='pointer-events-auto flex gap-3'>
            <FlippyFlopIcon className='md:hidden flex-shrink-0' selectedTeam={selectedTeam} />
            <OutlineButton
              className=''
              outline='#F3BD32'
              icon={<CoinsIcon />}
              text={userScore.toString()}
              onClick={() => setLeaderboardOpenedMobile((prev) => !prev)}
            />
            <OutlineButton
              className='w-full'
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              icon={<UserIcon />}
              text={account ? usernamesCache[account.address] : 'Connect'}
              onClick={() => {
                if (account) {
                  disconnect()
                  return
                }
                connect({ connector: cartridgeConnector })
              }}
            />
            {account?.address && (
              <OutlineButton
                icon={<CopyIcon />}
                outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
                onClick={() => {
                  if (!account) return
                  navigator.clipboard.writeText(account.address)
                }}
              />
            )}
          </div>
          <Leaderboard
            className={`${leaderboardOpenedMobile ? '' : 'hidden'} md:flex`}
            scores={leaderboard}
            isLoading={isLoading}
            selectedTeam={selectedTeam}
            teamScores={scores}
          />
        </div>
      </div>
    </div>
  )
}

export default Header
