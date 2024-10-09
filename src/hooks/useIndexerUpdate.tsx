import { useState, useEffect, useRef, useCallback } from 'react'
import { IndexerUpdate, ToriiClient } from '@/libs/dojo.c/dojo_c'

export function useIndexerUpdate(client: ToriiClient | undefined) {
  const [indexerUpdate, setIndexerUpdate] = useState<IndexerUpdate | undefined>(undefined)
  const subscription = useRef<any>()

  useEffect(() => {
    if (!client) return

    // Subscribe to indexer updates
    client.onIndexerUpdated(undefined, handleIndexerUpdate).then((sub) => {
      subscription.current = sub
    })
  }, [client])

  const handleIndexerUpdate = useCallback(async (update) => {
    setIndexerUpdate(update)
  }, [])

  return {
    head: indexerUpdate?.head ?? 0,
    tps: indexerUpdate?.tps ?? 0,
    lastBlockTimestamp: indexerUpdate?.last_block_timestamp ?? 0,
  }
}
