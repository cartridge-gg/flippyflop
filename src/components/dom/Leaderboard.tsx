import { useEffect, useMemo, useState } from 'react'
import ShieldIcon from './ShieldIcon'
import { S } from '@starknet-react/core/dist/index-79NvzQC9'
import { useAccount } from '@starknet-react/core'

interface LeaderboardProps {
  className?: string
  scores: { address: string; score: number; position: number; type: 'score' | 'separator' }[]
  usernames: Record<string, string>
}

const formatAddress = (address: string) => `${address.substring(0, 6)}...${address.substring(61)}`

const Leaderboard = ({ className, scores, usernames }: LeaderboardProps) => {
  const { account } = useAccount()

  return (
    <div
      className={`${className} flex w-full flex-col items-start gap-2 rounded-lg px-3 pb-3 pt-4 text-white backdrop-blur`}
      style={{
        background: 'rgba(8, 14, 19, 0.64)',
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.5)',
      }}
    >
      <span className='text-lg font-bold'>Leaderboard</span>
      <div className='flex flex-col items-start gap-2 self-stretch'>
        {scores.map((score, index) =>
          score.type === 'separator' ? (
            <div
              className='flex w-full justify-center self-center'
              style={{
                color: 'rgba(238, 238, 238, 0.60)',
              }}
            >
              ...
            </div>
          ) : (
            <div
              key={index}
              className={`flex items-center justify-between self-stretch rounded-s p-2`}
              style={{
                background:
                  score.address === account?.address ? 'rgba(243, 131, 51, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                color: score.address === account?.address ? 'rgba(243, 131, 51, 0.85)' : 'rgba(238, 238, 238, 0.90)',
              }}
            >
              <div className='flex items-end gap-2'>
                <span
                  className='min-w-4 text-[16px] font-thin'
                  style={{
                    color:
                      score.address === account?.address ? 'rgba(243, 131, 51, 0.64)' : 'rgba(238, 238, 238, 0.60)',
                  }}
                >
                  {score.position}.
                </span>
                <span className='font-semibold'>{`${usernames?.[score.address] ?? formatAddress(score.address)} ${score.address === account?.address ? '(you)' : ''}`}</span>
              </div>
              <div className='flex items-center gap-0.5'>
                <ShieldIcon />
                <span>{score.score}</span>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

export default Leaderboard
