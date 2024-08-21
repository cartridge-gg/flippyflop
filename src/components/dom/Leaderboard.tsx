import { useEffect, useMemo, useState } from 'react'
import ShieldIcon from './ShieldIcon'
import { S } from '@starknet-react/core/dist/index-79NvzQC9'
import { useAccount } from '@starknet-react/core'

interface LeaderboardProps {
  className?: string
  scores: { address: string; score: number }[]
}

const formatAddress = (address: string) => `${address.substring(0, 6)}...${address.substring(61)}`

const Leaderboard = ({ className, scores }: LeaderboardProps) => {
  const [usernames, setUsernames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (scores.length === 0) return

    fetch('https://api.cartridge.gg/query', {
      headers: {
        'content-type': 'application/json',
      },
      body: `{"query":"query {\\n  accounts(where:{\\n    contractAddressIn:[${scores
        .map((score) => `\\"${score.address}\\"`)
        .join(',')}]\\n  }) {\\n    edges {\\n      node {\\n        id,\\ncontractAddress      }\\n    }\\n  }\\n}"}`,
      method: 'POST',
    }).then((response) => {
      response.json().then((data) => {
        const usernames = data.data.accounts.edges.reduce((acc, edge) => {
          acc[edge.node.contractAddress] = edge.node.id
          return acc
        }, {})

        setUsernames(usernames)
      })
    })
  }, [scores])

  const { account } = useAccount()

  return (
    <div
      className={`${className} flex w-full flex-col items-start gap-2 rounded-lg px-3 pb-3 pt-4 text-white backdrop-blur`}
      style={{
        background: 'rgba(8, 14, 19, 0.64)',
      }}
    >
      <span className='text-lg font-bold'>Leaderboard</span>
      <div className='flex flex-col items-start gap-2 self-stretch'>
        {scores.map((score, index) => (
          <div
            key={index}
            className={`flex items-center justify-between self-stretch rounded-s p-2`}
            style={{
              background: score.address === account?.address ? 'rgba(243, 131, 51, 0.08)' : 'rgba(255, 255, 255, 0.08)',
              color: score.address === account?.address ? 'rgba(243, 131, 51, 0.85)' : 'rgba(238, 238, 238, 0.90)',
            }}
          >
            <div className='flex items-end gap-2'>
              <span
                className='min-w-4 text-[16px] font-thin'
                style={{
                  color: score.address === account?.address ? 'rgba(243, 131, 51, 0.64)' : 'rgba(238, 238, 238, 0.60)',
                }}
              >
                {index + 1}.
              </span>
              <span className='font-semibold'>{`${usernames[score.address] ?? formatAddress(score.address)} ${score.address === account?.address ? '(you)' : ''}`}</span>
            </div>
            <div className='flex items-center gap-0.5'>
              <ShieldIcon />
              <span>{score.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Leaderboard
