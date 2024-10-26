import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import type { IndexerUpdate, ToriiClient } from '@/libs/dojo.c/dojo_c'
import { useAccount } from '@starknet-react/core'
import { formatE } from '@/utils'
import { toast } from 'sonner'

export function useGame(client: ToriiClient | undefined) {
  const { address } = useAccount()
  const [lockedAt, setLockedAt] = useState<number>(0)
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
  }, [client])

  const handleEntityUpdate = useCallback(async (entity, subscription = false) => {
    if (entity['flippyflop-Game']) setLockedAt(Number(entity['flippyflop-Game'].locked_at.value))
    if (entity['flippyflop-Claim']) {
      const claimed = BigInt('0x' + entity['flippyflop-Claim'].amount.value)
      setClaimed(claimed)
      if (subscription) toast(`🎉 Congratulations! You just claimed ${formatE(claimed)} $FLIP`)
    }
  }, [])

  return {
    lockedAt,
    locked: useMemo(() => Date.now() / 1000 > lockedAt, [lockedAt]),
    claimed,
  }
}
