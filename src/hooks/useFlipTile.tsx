import { useCallback } from 'react'
import { useAccount, useConnect, useProvider } from '@starknet-react/core'
import { toast } from 'sonner'
import { ACTIONS_ADDRESS } from '@/constants'
import { Powerup, Tile } from '@/models'
import { maskAddress } from '@/utils'
import { Updater } from 'use-immer'

interface UseFlipTileProps {
  updateTiles: Updater<Record<string, Tile>>
  playFlipSound: () => void
}

export function useFlipTile({ updateTiles, playFlipSound }: UseFlipTileProps) {
  const { provider } = useProvider()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()

  const flipTile = useCallback(
    async (x: number, y: number) => {
      if (!account) {
        connect({ connector: connectors[0] })
        return false
      }

      const address = account.address ? maskAddress(account.address) : undefined
      const tileKey = `${x},${y}`

      updateTiles((draft) => {
        draft[tileKey] = {
          x,
          y,
          address: address,
          powerup: Powerup.None,
          powerupValue: 0,
        }
      })
      return
    },
    [account, connect, connectors, playFlipSound, provider, updateTiles],
  )

  return { flipTile }
}
