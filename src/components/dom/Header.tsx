import React, { useState } from 'react'
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

interface HeaderProps {
  userScore: number
  humanScore: number
  botScore: number
  leaderboard: any[]
}

const Header: React.FC<HeaderProps> = ({ userScore, humanScore, botScore, leaderboard }) => {
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { account, status } = useAccount()
  const { usernamesCache } = useUsernames()
  const cartridgeConnector = connectors[0]

  const [leaderboardOpenedMobile, setLeaderboardOpenedMobile] = useState(false)

  return (
    <div className='pointer-events-none fixed top-0 z-20 flex w-full flex-col items-start justify-start gap-4 bg-gradient-to-b from-black/70 to-transparent p-4'>
      <div className='flex flex-col-reverse md:flex-row w-full items-start gap-4 md:gap-12'>
        <div className='flex w-full flex-col justify-between gap-4'>
          <FlippyFlop className='hidden md:flex' />
          <Scorebar className={'w-full'} humansScore={humanScore} botsScore={botScore} />
        </div>
        <div className='flex w-full md:w-2/5 flex-col gap-4'>
          <div className='pointer-events-auto flex gap-4'>
            <FlippyFlopIcon className='md:hidden flex-shrink-0' />
            <OutlineButton
              className=''
              outline='#F3BD32'
              icon={<CoinsIcon />}
              text={userScore.toString()}
              onClick={() => setLeaderboardOpenedMobile((prev) => !prev)}
            />
            <OutlineButton
              className='w-full'
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
                onClick={() => {
                  if (!account) return
                  navigator.clipboard.writeText(account.address)
                }}
              />
            )}
          </div>
          <Leaderboard className={`${leaderboardOpenedMobile ? '' : 'hidden'} md:flex`} scores={leaderboard} />
        </div>
      </div>
    </div>
  )
}

export default Header
