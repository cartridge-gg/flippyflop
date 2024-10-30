import { useConnect, useDisconnect, useAccount } from '@starknet-react/core'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { toast } from 'sonner'

import ClaimDialog from './ClaimDialog'
import CoinsIcon from './CoinsIcon'
import IntroDialog from './IntroDialog'
import MilestoneDialog from './MilestoneDialog'
import MusicPlayer from './MusicPlayer'
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

import type { MusicPlayerHandle } from './MusicPlayer'
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
  const [showIntroDialog, setShowIntroDialog] = useState(localStorage.getItem('seenIntro') !== 'true')
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false)
  const [currentMilestone, setCurrentMilestone] = useState(0)

  const musicPlayerRef = useRef<MusicPlayerHandle>(null)

  useEffect(() => {
    if (Date.now() / 1000 < timeRange[0]) {
      setShowIntroDialog(true)
    } else {
      musicPlayerRef.current?.play()
    }
  }, [timeRange])

  const lockedTiles = useMemo(() => {
    return Object.values(tiles).filter((tile) => tile.powerupValue > 2).length
  }, [tiles])

  const scores = useMemo(() => {
    const scores = Object.fromEntries(Object.values(TEAMS).map((team) => [team, 0]))

    Object.values(tiles).forEach((tile) => {
      if (tile.address === '0x0') return

      const team = tile.team
      scores[TEAMS[team]] += 1
    })

    return scores
  }, [tiles])

  const MILESTONES = [100, 500, 1000, 2000, 5000]

  const flippedTiles = useMemo(() => {
    return Object.values(tiles).filter((tile) => tile.address === (address ? maskAddress(address) : undefined))
  }, [tiles, address])

  useEffect(() => {
    // Get the highest milestone achieved
    const milestone = MILESTONES.findLast((m) => flippedTiles.length >= m)

    if (milestone && milestone > currentMilestone) {
      setCurrentMilestone(milestone)
      setShowMilestoneDialog(true)
    }
  }, [flippedTiles, currentMilestone])

  useEffect(() => {
    if (Date.now() / 1000 > timeRange[1]) {
      setClaimDialogOpen(true)
    }
  }, [timeRange])

  return (
    <div className='pointer-events-none fixed top-0 z-20 flex w-full flex-col items-start justify-start gap-4 bg-gradient-to-b from-black/70 to-transparent p-4'>
      <div className='flex flex-col-reverse md:flex-row w-full items-start gap-4 md:gap-12'>
        <div className='flex w-full flex-col justify-between gap-4'>
          <div className='hidden md:flex flex-row gap-8 items-center'>
            <FlippyFlop className='' selectedTeam={selectedTeam} />
            <TPS tps={tps} />
            <TeamSelector className='hidden lg:flex' selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
            <MusicPlayer
              className='hidden xl:inline-flex'
              ref={musicPlayerRef}
              outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
            />
          </div>
          <Scorebar
            className='w-full pointer-events-auto'
            scores={scores}
            lockedTiles={lockedTiles}
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
          <MusicPlayer
            className='inline-flex xl:hidden'
            ref={musicPlayerRef}
            outline={TILE_REGISTRY[TEAMS[selectedTeam]].border}
          />
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
          musicPlayerRef.current?.play()
        }}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        startTime={timeRange[0]}
      />
      <MilestoneDialog
        isOpen={showMilestoneDialog}
        onClose={() => setShowMilestoneDialog(false)}
        selectedTeam={selectedTeam}
        milestone={currentMilestone}
        userScore={userScore}
        flippedTiles={flippedTiles}
      />
    </div>
  )
}

export default Header
