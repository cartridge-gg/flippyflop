'use client'

import { forwardRef, Suspense, useImperativeHandle, useMemo, useRef } from 'react'
import {
  OrbitControls,
  PerspectiveCamera,
  View as ViewImpl,
  MapControls,
  OrthographicCamera,
  Stats,
} from '@react-three/drei'
import { Three } from '@/helpers/components/Three'
import { WORLD_SIZE } from '@/constants'

export const Common = ({ color }) => {
  return (
    <Suspense fallback={null}>
      {color && <color attach='background' args={[color]} />}
      <ambientLight />
      <OrthographicCamera makeDefault position={[200, 200, 200]} zoom={80} />
      {/* <Stats /> */}
    </Suspense>
  )
}

interface ViewProps {
  children: React.ReactNode
  className?: string
}

const View = forwardRef(({ children, className, ...props }: ViewProps, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>
          {children}
          {
            <MapControls
              // screenSpacePanning
              minZoom={50}
              maxZoom={200}
              maxPolarAngle={Math.PI / 2.5}
              minAzimuthAngle={-Math.PI / 4}
              maxAzimuthAngle={Math.PI / 4}
              minDistance={10}
              maxDistance={WORLD_SIZE}
            />
          }
          {/* <axesHelper position={[-1, 0, -1]} args={[10]} />
          <gridHelper position={[WORLD_SIZE / 2, 0, WORLD_SIZE / 2]} args={[WORLD_SIZE, WORLD_SIZE]} /> */}
        </ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
