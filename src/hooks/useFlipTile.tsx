import { useCallback, useRef } from 'react'
import { useAccount, useConnect, useProvider } from '@starknet-react/core'
import { toast } from 'sonner'
import { ACTIONS_ADDRESS } from '@/constants'
import { Powerup, Tile } from '@/models'
import { calculatePowerup, maskAddress } from '@/utils'

interface UseFlipTileProps {
  setTiles: React.Dispatch<React.SetStateAction<Record<string, Tile>>>
  playFlipSound: () => void
}

export function useFlipTile({ setTiles, playFlipSound }: UseFlipTileProps) {
  const { provider } = useProvider()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()
  const lastFlipped = useRef(0)

  const revertTile = useCallback(
    (x: number, y: number) => {
      setTiles((prevTiles) => {
        const newTiles = { ...prevTiles }
        delete newTiles[`${x},${y}`]
        return newTiles
      })
    },
    [setTiles],
  )

  const flipTile = useCallback(
    async (x: number, y: number) => {
      if (!account) {
        connect({ connector: connectors[0] })
        return false
      }

      const address = account.address ? maskAddress(account.address) : undefined
      const tileKey = `${x},${y}`

      setTiles((prevTiles) => ({
        ...prevTiles,
        [tileKey]: {
          x,
          y,
          address: address,
          powerup: Powerup.None,
          powerupValue: 0,
        },
      }))

      playFlipSound()

      try {
        const tx = await account.execute([
          {
            contractAddress: ACTIONS_ADDRESS,
            entrypoint: 'flip',
            calldata: ['0x' + x.toString(16), '0x' + y.toString(16)],
          },
        ])

        const { powerup, powerupValue } = calculatePowerup(x, y, tx.transaction_hash)

        setTiles((prevTiles) => ({
          ...prevTiles,
          [tileKey]: { ...prevTiles[tileKey], powerup, powerupValue },
        }))

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
        //   revertTile(x, y)
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
        revertTile(x, y)
        return false
      }
    },
    [account, connect, connectors, playFlipSound, provider, setTiles],
  )

  return { flipTile }
}
