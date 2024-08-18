'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import FlipButton from './FlipButton'
import FlippyFlop from './FlippyFlop'
import Scorebar from './Scorebar'
import { useAsync } from 'react-async-hook'
import { TORII_URL, TORII_RPC_URL, TORII_RELAY_URL, WORLD_ADDRESS, TILE_MODEL_TAG, WORLD_SIZE } from '@/constants'
import { useWasm, WasmProvider } from './WasmContext'
import { Entity, Subscription } from 'dojo.c/pkg'
import { parseModel } from '@/utils'
const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })
import { Tile as TileModel } from 'src/models'
import CheckmarkIcon from './CheckmarkIcon'
import OrangeButton from './OrangeButton'
import UserIcon from './UserIcon'
import Leaderboard from './Leaderboard'

const Layout = ({ children }) => {
  const ref = useRef()

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: ' 100%',
        height: '100%',
        overflow: 'auto',
        touchAction: 'auto',
      }}
    >
      {children}
      <Scene
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
        }}
        eventSource={ref}
        eventPrefix='client'
      />
    </div>
  )
}

export { Layout }
