import { useAccount, useConnect, useProvider } from '@starknet-react/core'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { ACTIONS_ADDRESS } from '@/constants'
import { Powerup } from '@/models'
import { calculatePowerup, formatEta, maskAddress, parseError } from '@/utils'

import type { Tile } from '@/models'

interface UseFlipTileProps {
  updateTile: (tile: Tile) => () => void
  playFlipSound: () => void
  timeRange: [number, number]
  isLoading: boolean
}

export function useFlipTile({ updateTile, playFlipSound, timeRange, isLoading }: UseFlipTileProps) {
  const { provider } = useProvider()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()

  const flipTile = useCallback(
    async (x: number, y: number, team: number) => {
      if (!account) {
        connect({ connector: connectors[0] })
        return false
      }

      if (isLoading) {
        return false
      }

      if (Date.now() / 1000 > timeRange[1]) {
        toast(`Game ended ${formatEta(timeRange[1])} ago`)
        return false
      }

      if (Date.now() / 1000 < timeRange[0]) {
        toast(`Game starts in ${formatEta(timeRange[0])}`)
        return false
      }

      const address = account.address ? maskAddress(account.address) : undefined
      const revertTile = updateTile({
        x,
        y,
        address: address,
        powerup: Powerup.None,
        powerupValue: 0,
        team: team,
      })

      playFlipSound()

      try {
        const tx = await account.execute([
          {
            contractAddress: ACTIONS_ADDRESS,
            entrypoint: 'flip',
            calldata: ['0x' + x.toString(16), '0x' + y.toString(16), '0x' + team.toString(16)],
          },
        ])
        const { powerup, powerupValue } = calculatePowerup(x, y, tx.transaction_hash)
        updateTile({
          x,
          y,
          address: address,
          powerup,
          powerupValue,
          team,
        })

        const flipped = await provider.waitForTransaction(tx.transaction_hash)
        if (!flipped.isSuccess()) {
          toast(
            <div className='flex text-white flex-row items-start w-full gap-3'>
              <div className='text-current'>😔 Failed to flip tile. Try flipping another tile.</div>
              <div className='flex-grow' />
              <div
                className='flex px-1 justify-center items-center gap-2 rounded-s text-current'
                style={{
                  background: 'rgba(255, 255, 255, 0.10)',
                }}
              >
                X {x}, Y {y}
              </div>
            </div>,
          )
          setTimeout(revertTile, 1200)
          return false
        }
      } catch (e) {
        toast(
          <div className='flex text-white flex-row items-start w-full gap-3'>
            <div className='text-current'>😔 Failed to flip tile: {parseError(e)}</div>
            <div className='flex-grow' />
            <div
              className='flex px-1 justify-center items-center gap-2 rounded-s text-current'
              style={{
                background: 'rgba(255, 255, 255, 0.10)',
              }}
            >
              X {x}, Y {y}
            </div>
          </div>,
        )
        setTimeout(revertTile, 1200)
        return false
      }
    },
    [account, connect, connectors, playFlipSound, provider, updateTile, timeRange, isLoading],
  )

  return { flipTile }
}
