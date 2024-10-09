import { useState, useEffect, useRef, useCallback } from 'react'
import { Powerup, Tile as TileModel } from 'src/models'
import { fetchAllEntities, formatAddress, maskAddress, parseTileModel } from 'src/utils'
import { TILE_MODEL_TAG } from '@/constants'
import { useUsernames } from '@/contexts/UsernamesContext'
import { useAccount } from '@starknet-react/core'
import { toast } from 'sonner'
import { ToriiClient } from '@/libs/dojo.c/dojo_c'

export function useTPS(client: ToriiClient | undefined) {
  const [tps, setTps] = useState<number>(0)
  const subscription = useRef<any>()

  useEffect(() => {
    if (!client) return

    // Subscribe to indexer updates
    client.onIndexerUpdated(undefined, handleIndexerUpdate).then((sub) => {
      subscription.current = sub
    })
  }, [client])

  const handleIndexerUpdate = useCallback(async (update) => {
    setTps(update.tps)
  }, [])

  return { tps }
}
