import { useState, useEffect } from 'react'
import { createClient, ToriiClient } from 'pkg/dojo_c'
import { TORII_URL, TORII_RPC_URL, TORII_RELAY_URL, WORLD_ADDRESS } from '@/constants'

export function useClient() {
  const [client, setClient] = useState<ToriiClient>()

  useEffect(() => {
    createClient({
      toriiUrl: TORII_URL,
      rpcUrl: TORII_RPC_URL,
      relayUrl: TORII_RELAY_URL,
      worldAddress: WORLD_ADDRESS,
    }).then(setClient)
  }, [])

  return { client }
}
