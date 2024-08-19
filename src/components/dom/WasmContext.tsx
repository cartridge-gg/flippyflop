'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { TORII_URL, TORII_RPC_URL, TORII_RELAY_URL, WORLD_ADDRESS } from '@/constants'

interface WasmContextType {
  wasmRuntime: any
  client: any | null
}

const WasmContext = createContext<WasmContextType | null>(null)

export const useWasm = () => {
  const context = useContext(WasmContext)
  if (!context) {
    throw new Error('useWasm must be used within a WasmProvider')
  }
  return context
}

const WasmProviderComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wasmRuntime, setWasmRuntime] = React.useState<any>(null)
  const [client, setClient] = React.useState<any>(null)

  React.useEffect(() => {
    const initWasm = async () => {
      try {
        const runtime = await import('dojo.c/pkg')
        setWasmRuntime(runtime)

        const newClient = await runtime.createClient({
          toriiUrl: TORII_URL,
          rpcUrl: TORII_RPC_URL,
          relayUrl: TORII_RELAY_URL,
          worldAddress: WORLD_ADDRESS,
        })
        setClient(newClient)
      } catch (error) {
        console.error('Failed to initialize WASM:', error)
      }
    }

    initWasm()
  }, [])

  return <WasmContext.Provider value={{ wasmRuntime, client }}>{children}</WasmContext.Provider>
}

export const WasmProvider = dynamic(() => Promise.resolve(WasmProviderComponent), {
  ssr: false,
})
