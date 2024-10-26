import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

import type { IndexerUpdate, ToriiClient } from '@/libs/dojo.c/dojo_c'

export function useGame(client: ToriiClient | undefined) {
  const [lockedAt, setLockedAt] = useState<number>(0)
  const subscription = useRef<any>()

  useEffect(() => {
    if (!client) return

    // Fetch initial game state
    client
      .getEntities({
        clause: {
          Keys: {
            keys: [],
            pattern_matching: 'VariableLen',
            models: ['flippyflop-Game'],
          },
        },
        limit: 1,
        offset: 0,
        dont_include_hashed_keys: true,
      })
      .then((games) => {
        if (Object.keys(games).length === 0) return
        setLockedAt(Number(Object.values(games)[0]['flippyflop-Game'].locked_at.value))
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
        ],
        handleGameUpdate,
      )
      .then((sub) => {
        subscription.current = sub
      })

    return () => {
      subscription.current?.cancel()
    }
  }, [client])

  const handleGameUpdate = useCallback(async (_, game) => {
    if (!game['flippyflop-Game']) return
    setLockedAt(Number(game['flippyflop-Game'].locked_at.value))
  }, [])

  return {
    lockedAt,
    locked: useMemo(() => Date.now() / 1000 > lockedAt, [lockedAt]),
  }
}
