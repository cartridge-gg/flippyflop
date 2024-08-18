import ShieldIcon from './ShieldIcon'

interface LeaderboardProps {
  scores: Array<{
    name: string
    score: number
  }>
}

const Leaderboard = ({ scores }: LeaderboardProps) => {
  return (
    <div
      className='flex w-full flex-col items-start gap-2 rounded-lg px-3 pb-3 pt-4 text-white backdrop-blur'
      style={{
        background: 'rgba(8, 14, 19, 0.64)',
        boxShadow: '0px 4px 4px 0px #000',
        color: 'rgba(238, 238, 238, 0.80)',
      }}
    >
      <span className='text-lg font-bold'>Leaderboard</span>
      <div className='flex flex-col items-start gap-2 self-stretch'>
        {scores.map((score, index) => (
          <div
            key={index}
            className='flex items-center justify-between self-stretch rounded-s p-2'
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className='flex items-end gap-2'>
              <span className='min-w-4 text-[16px] font-thin'>{index + 1}.</span>
              <span className='font-bold'>{score.name}</span>
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
