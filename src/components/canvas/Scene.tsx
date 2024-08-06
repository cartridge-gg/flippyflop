'use client'

import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { r3f } from '@/helpers/global'
import * as THREE from 'three'
import { useEffect, useMemo, useState } from 'react'
import { TORII_RELAY_URL, TORII_RPC_URL, TORII_URL, WORLD_ADDRESS } from '@/constants'
import { useAsync } from 'react-async-hook'

export default function Scene({ ...props }) {
  // Everything defined in here will persist between route changes, only children are swapped

  return (
    <Canvas {...props} onCreated={(state) => (state.gl.toneMapping = THREE.AgXToneMapping)}>
      {/* @ts-ignore */}
      <r3f.Out />
      <Preload all />
    </Canvas>
  )
}
