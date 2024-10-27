import { useConnect, useDisconnect, useAccount } from '@starknet-react/core'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import ClaimDialog from './ClaimDialog'
import CoinsIcon from './CoinsIcon'
import IntroDialog from './IntroDialog'
import TeamSelector from './TeamSelector'
import TPS from './TPS'
import CopyIcon from '@/components/dom/CopyIcon'
import FlippyFlop from '@/components/dom/FlippyFlop'
import FlippyFlopIcon from '@/components/dom/FlippyFlopIcon'
import Leaderboard from '@/components/dom/Leaderboard'
import OutlineButton from '@/components/dom/OrangeButton'
import Scorebar from '@/components/dom/Scorebar'
import UserIcon from '@/components/dom/UserIcon'
import { TEAMS, TILE_REGISTRY } from '@/constants'
import { useUsernames } from '@/contexts/UsernamesContext'
import { Powerup } from '@/models'
import { maskAddress } from '@/utils'

import type { Tile } from '@/models'

interface HeaderProps {
  tiles: Record<string, Tile>
  tps: number
  leaderboard: any[]
  isLoading: boolean
  selectedTeam: number
  setSelectedTeam: (team: number) => void
  timeRange: [number, number]
  claimed: bigint
}

const Header: React.FC<HeaderProps> = ({
  tiles,
  tps,
  leaderboard,
  isLoading,
  selectedTeam,
  setSelectedTeam,
  timeRange,
  claimed,
}) => {
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
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [showIntroDialog, setShowIntroDialog] = useState(Date.now() / 1000 < timeRange[0])

  useEffect(() => {
    if (Date.now() / 1000 < timeRange[0]) {
      setShowIntroDialog(true)
    }
  }, [timeRange])

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
            <TeamSelector className='hidden lg:flex' selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
          </div>
          <Scorebar
            className='w-full pointer-events-auto'
            scores={scores}
            selectedTeam={selectedTeam}
            onClick={() => setLeaderboardOpenedMobile((prev) => !prev)}
          />
        </div>
        <div className='flex w-full md:w-2/5 md:max-w-96 flex-col gap-4'>
          <div className='pointer-events-auto flex gap-3'>
            <FlippyFlopIcon className='md:hidden flex-shrink-0' selectedTeam={selectedTeam} />
            <OutlineButton
              className=''
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
              icon={<CoinsIcon />}
              text={userScore.toString()}
              onClick={() => {
                setClaimDialogOpen(true)
              }}
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
                  navigator.clipboard.writeText('0x' + account.address.slice(2).padStart(64, '0'))
                  toast('🖋️ Copied address to clipboard')
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
            onClose={() => setLeaderboardOpenedMobile(false)}
          />
        </div>
      </div>
      <ClaimDialog
        isOpen={claimDialogOpen}
        onClose={() => setClaimDialogOpen(false)}
        selectedTeam={selectedTeam}
        timeRange={timeRange}
        claimed={claimed}
        userScore={userScore}
        tiles={tiles}
      />
      <IntroDialog
        isOpen={showIntroDialog}
        onClose={() => {
          setShowIntroDialog(false)
          localStorage.setItem('seenIntro', 'true')
        }}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        startTime={timeRange[0]}
      />
    </div>
  )
}

export default Header
