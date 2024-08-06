'use client'

import { Tile } from '@/components/canvas/Examples'
import { TORII_URL, TORII_RPC_URL, TORII_RELAY_URL, WORLD_ADDRESS } from '@/constants'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'

const Logo = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Logo), { ssr: false })
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 size-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

export default function Page() {
  const wasmRuntime = useAsync(async () => import('dojo.c/pkg'), [])

  const client = useAsync(async () => {
    return await wasmRuntime.result.createClient({
      toriiUrl: TORII_URL,
      rpcUrl: TORII_RPC_URL,
      relayUrl: TORII_RELAY_URL,
      worldAddress: WORLD_ADDRESS,
    })
  }, [wasmRuntime.result])

  const [entities, setEntities] = useState({})

  useEffect(() => {
    if (!client.result) return

    client.result.getAllEntities(1000, 0).then((entities) => {
      setEntities(entities)

      client.result.onEntityUpdated(
        [
          {
            Keys: {
              keys: [],
              pattern_matching: 'VariableLen',
              models: [],
            },
          },
        ],
        (newEntities) => {
          setEntities((prev) => ({ ...prev, ...newEntities }))
        },
      )
    })
  }, [client.result])

  return (
    <>
      <View orbit className='flex h-screen w-full flex-col items-center justify-center'>
        <Suspense fallback={null}>
          {Object.keys(entities).map((key) => (
            <Tile
              key={key}
              x={entities[key]['flippyflop-Tile'].x.value}
              y={entities[key]['flippyflop-Tile'].y.value}
              isFlipped={entities[key]['flippyflop-Tile'].flipped.value != '0x0'}
              onClick={() => console.log('clicked')}
            />
          ))}
          <Common />
        </Suspense>
      </View>
    </>
  )
}
