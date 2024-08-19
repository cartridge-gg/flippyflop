'use client'
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
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

export const WasmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wasmRuntime, setWasmRuntime] = useState<any>(null)
  const [client, setClient] = useState<any>(null)

  useEffect(() => {
    const initWasm = async () => {
      const runtime = await import('dojo.c/pkg')
      setWasmRuntime(runtime)

      const newClient = await runtime.createClient({
        toriiUrl: TORII_URL,
        rpcUrl: TORII_RPC_URL,
        relayUrl: TORII_RELAY_URL,
        worldAddress: WORLD_ADDRESS,
      })
      setClient(newClient)
    }

    initWasm()
  }, [])

  return <WasmContext.Provider value={{ wasmRuntime, client }}>{children}</WasmContext.Provider>
}
