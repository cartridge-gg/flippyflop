import { useEffect, useMemo, useState } from 'react'
import ShieldIcon from './ShieldIcon'
import { S } from '@starknet-react/core/dist/index-79NvzQC9'

interface LeaderboardProps {
  className?: string
  scores: Record<string, number>
}

const Leaderboard = ({ className, scores }: LeaderboardProps) => {
  // const [usernames, setUsernames] = useState<Record<string, string>>({})

  // useEffect(() => {
  //   fetch('https://api.cartridge.gg/query', {
  //     headers: {
  //       accept: 'application/json, multipart/mixed',
  //       'content-type': 'application/json',
  //     },
  //     body: '{"query":"query {\\n  accounts(where:{\\n    contractAddressIn:[]\\n  }) {\\n    edges {\\n      node {\\n        id\\n      }\\n    }\\n  }\\n}"}',
  //     method: 'POST',
  //     mode: 'cors',
  //     credentials: 'include',
  //   }).then((response) => {
  //     response.json().then((data) => {
  //       const usernames = data.data.accounts.edges.reduce((acc, edge) => {
  //         acc[edge.node.id] = edge.node.id
  //         return acc
  //       }, {})

  //       setUsernames(usernames)
  //     })
  //   })
  // }, [scores])

  // sort scores
  const sortedScores = useMemo(() => {
    return Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
  }, [scores])

  return (
    <div
      className={`${className} flex w-full flex-col items-start gap-2 rounded-lg px-3 pb-3 pt-4 text-white backdrop-blur`}
      style={{
        background: 'rgba(8, 14, 19, 0.64)',
        color: 'rgba(238, 238, 238, 0.80)',
      }}
    >
      <span className='text-lg font-bold'>Leaderboard</span>
      <div className='flex flex-col items-start gap-2 self-stretch'>
        {sortedScores.map((score, index) => (
          <div
            key={index}
            className='flex items-center justify-between self-stretch rounded-s p-2'
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className='flex items-end gap-2'>
              <span className='min-w-4 text-[16px] font-thin'>{index + 1}.</span>
              <span className='font-bold'>{score.name.substring(0, 8)}</span>
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
