import { useCallback, useRef } from 'react'
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
  const lastFlipped = useRef(0)

  const flipTile = useCallback(
    async (x: number, y: number) => {
      if (!account) {
        connect({ connector: connectors[0] })
        return false
      }

      if (Date.now() - lastFlipped.current < 300) {
        return false
      }
      lastFlipped.current = Date.now()

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

      playFlipSound()

      const revertTile = () =>
        updateTiles((draft) => {
          delete draft[tileKey]
        })

      try {
        const tx = await account.execute([
          {
            contractAddress: ACTIONS_ADDRESS,
            entrypoint: 'flip',
            calldata: ['0x' + x.toString(16), '0x' + y.toString(16)],
          },
        ])

        // const flipped = await provider.waitForTransaction(tx.transaction_hash)
        // if (!flipped.isSuccess()) {
        //   toast(
        //     <div className='flex text-white flex-row items-start w-full gap-3'>
        //       <div className='text-current'>😔 Failed to flip tile. Try flipping another tile.</div>
        //       <div className='flex-grow'></div>
        //       <div
        //         className='flex px-1 justify-center items-center gap-2 rounded-s text-current'
        //         style={{
        //           background: 'rgba(255, 255, 255, 0.10)',
        //         }}
        //       >
        //         X {x}, Y {y}
        //       </div>
        //     </div>,
        //   )
        //   revertTile()
        //   return false
        // }
        return true
      } catch (e) {
        toast(
          <div className='flex text-white flex-row items-start w-full gap-3'>
            <div className='text-current'>😔 Failed to flip tile.</div>
            <div className='flex-grow'></div>
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
        revertTile()
        return false
      }
    },
    [account, connect, connectors, playFlipSound, provider, updateTiles],
  )

  return { flipTile }
}
