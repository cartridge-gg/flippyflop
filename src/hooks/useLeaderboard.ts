import { useMemo } from 'react'
import { Powerup, Tile as TileModel } from 'src/models'
import { useUsernamesBatch } from '@/contexts/UsernamesContext'

export function useLeaderboard(tiles: Record<string, TileModel>, accountAddress?: string) {
  const leaderboard = useMemo(() => {
    const allEntries = Object.values(tiles).reduce(
      (acc, tile) => {
        if (tile.address === '0x0') return acc
        acc[tile.address] = (acc[tile.address] || 0) + (tile.powerup === Powerup.Multiplier ? tile.powerupValue : 1)
        return acc
      },
      {} as Record<string, number>,
    )

    const sortedLeaderboard = Object.entries(allEntries)
      .sort(([, a], [, b]) => b - a)
      .map(([address, score], index) => ({ address, score, position: index + 1, type: 'score' }))

    if (!accountAddress) {
      return sortedLeaderboard.slice(0, 10)
    }

    const top5 = sortedLeaderboard.slice(0, 5)
    const userIndex = sortedLeaderboard.findIndex((entry) => accountAddress === entry.address)

    if (userIndex === -1 || userIndex < 10) {
      return sortedLeaderboard.slice(0, 10)
    }

    const start = Math.max(0, userIndex - 2)
    const end = Math.min(sortedLeaderboard.length, userIndex + 3)
    const userSurroundingScores = sortedLeaderboard.slice(start, end)

    return [...top5, { type: 'separator' }, ...userSurroundingScores] as any
  }, [tiles, accountAddress])

  const addresses = leaderboard.map((entry) => entry.address)
  useUsernamesBatch(addresses)

  return { leaderboard }
}
