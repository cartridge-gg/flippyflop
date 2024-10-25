import { useState, useEffect } from 'react'

import { TORII_URL, TORII_RPC_URL, TORII_RELAY_URL, WORLD_ADDRESS } from '@/constants'
import { createClient } from '@/libs/dojo.c/dojo_c'

import type { ToriiClient } from '@/libs/dojo.c/dojo_c'

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
