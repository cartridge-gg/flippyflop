import { useAccount } from '@starknet-react/core'
import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'

import { formatE, parseGameModel } from '@/utils'

import type { ToriiClient } from '@/libs/dojo.c/dojo_c'

export function useGame(client: ToriiClient | undefined) {
  const { address } = useAccount()
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 0])
  const [claimed, setClaimed] = useState<bigint>(BigInt(0))
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [showConfetti, setShowConfetti] = useState(false)
  const subscription = useRef<any>()

  useEffect(() => {
    if (!client) return

    // Fetch initial game state
    client
      .getEntities({
        clause: {
          Composite: {
            operator: 'Or',
            clauses: [
              {
                Keys: {
                  keys: ['0x0'],
                  pattern_matching: 'FixedLen',
                  models: ['flippyflop-Game'],
                },
              },
              {
                Keys: {
                  keys: [address ?? '0x0'],
                  pattern_matching: 'FixedLen',
                  models: ['flippyflop-Claim'],
                },
              },
            ],
          },
        },
        limit: 1000,
        offset: 0,
        dont_include_hashed_keys: false,
      })
      .then((entities) => {
        Object.values(entities).forEach((entity) => handleEntityUpdate(entity, false))
      })

    client
      .getEventMessages({
        clause: {
          Keys: {
            keys: [address ?? '0x0'],
            pattern_matching: 'FixedLen',
            models: ['flippyflop-FlipBalance'],
          },
        },
        limit: 1,
        offset: 0,
        dont_include_hashed_keys: false,
      })
      .then((entities) => {
        Object.values(entities).forEach((entity) => handleEntityUpdate(entity, false))
      })

    client.onEventMessageUpdated(
      [
        {
          Keys: {
            keys: [address ?? '0x0'],
            pattern_matching: 'FixedLen',
            models: ['flippyflop-FlipBalance'],
          },
        },
      ],
      (_, entity) => handleEntityUpdate(entity, true),
    )

    // Subscribe to game updates
    client
      .onEntityUpdated(
        [
          {
            Keys: {
              keys: ['0x0'],
              pattern_matching: 'FixedLen',
              models: ['flippyflop-Game'],
            },
          },
          {
            Keys: {
              keys: [address ?? '0x0'],
              pattern_matching: 'FixedLen',
              models: ['flippyflop-Claim'],
            },
          },
        ],
        (_, entity) => handleEntityUpdate(entity, true),
      )
      .then((sub) => {
        subscription.current = sub
      })

    return () => {
      subscription.current?.cancel()
    }
  }, [client, address])

  const handleEntityUpdate = async (entity, subscription = false) => {
    if (entity['flippyflop-FlipBalance']) {
      console.log('flippyflop-FlipBalance', entity['flippyflop-FlipBalance'])
      const balance = BigInt('0x' + entity['flippyflop-FlipBalance'].balance.value)
      setBalance(balance)
    }
    if (entity['flippyflop-Game']) {
      const { startsAt, endsAt } = parseGameModel(entity['flippyflop-Game'])
      setTimeRange([startsAt, endsAt])
    }
    if (entity['flippyflop-Claim']) {
      const claimed = BigInt('0x' + entity['flippyflop-Claim'].amount.value)
      setClaimed((prev) => {
        if (subscription) {
          toast(`🎉 Congratulations! You just received ${formatE(claimed - prev)} $FLIP`)
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        }
        return claimed
      })
    }
  }

  return {
    timeRange,
    isStarted: useMemo(() => Date.now() / 1000 > timeRange[0], [timeRange]),
    isEnded: useMemo(() => Date.now() / 1000 > timeRange[1], [timeRange]),
    claimed: address ? claimed : BigInt(0),
    balance,
    showConfetti,
  }
}
