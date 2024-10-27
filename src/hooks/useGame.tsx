import { useAccount } from '@starknet-react/core'
import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'

import { formatE, parseGameModel } from '@/utils'

import type { ToriiClient } from '@/libs/dojo.c/dojo_c'

export function useGame(client: ToriiClient | undefined) {
  const { address } = useAccount()
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 0])
  const [claimed, setClaimed] = useState<bigint>(BigInt(0))
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
                  keys: [],
                  pattern_matching: 'VariableLen',
                  models: ['flippyflop-Game'],
                },
              },
              {
                Keys: {
                  keys: [address],
                  pattern_matching: 'FixedLen',
                  models: ['flippyflop-Claim'],
                },
              },
            ],
          },
        },
        limit: 2,
        offset: 0,
        dont_include_hashed_keys: false,
      })
      .then((entities) => {
        Object.values(entities).forEach((entity) => handleEntityUpdate(entity, false))
      })

    // Subscribe to game updates
    client
      .onEntityUpdated(
        [
          {
            Keys: {
              keys: [],
              pattern_matching: 'VariableLen',
              models: ['flippyflop-Game'],
            },
          },
          {
            Keys: {
              keys: [address],
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
    if (entity['flippyflop-Game']) {
      const { startsAt, endsAt } = parseGameModel(entity['flippyflop-Game'])
      setTimeRange([startsAt, endsAt])
    }
    if (entity['flippyflop-Claim']) {
      const claimed = BigInt('0x' + entity['flippyflop-Claim'].amount.value)
      setClaimed((prev) => {
        if (subscription && address) toast(`🎉 Congratulations! You just claimed ${formatE(claimed - prev)} $FLIP`)
        return claimed
      })
    }
  }

  return {
    timeRange,
    isStarted: useMemo(() => Date.now() / 1000 > timeRange[0], [timeRange]),
    isEnded: useMemo(() => Date.now() / 1000 > timeRange[1], [timeRange]),
    claimed: address ? claimed : BigInt(0),
  }
}
