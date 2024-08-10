'use client'

import { forwardRef, Suspense, useImperativeHandle, useRef } from 'react'
import { OrbitControls, PerspectiveCamera, View as ViewImpl, MapControls, OrthographicCamera } from '@react-three/drei'
import { Three } from '@/helpers/components/Three'

export const Common = ({ color }) => (
  <Suspense fallback={null}>
    {color && <color attach='background' args={[color]} />}
    <ambientLight />
    <OrthographicCamera makeDefault position={[30, 30, 30]} zoom={60} />
    {/* <OrthographicCamera makeDefault position={[30, 30, 30 * 1.4]} zoom={60} /> */}
  </Suspense>
)

const View = forwardRef(({ children, orbit, ...props }, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>
          {children}
          {orbit && <MapControls screenSpacePanning />}
          <axesHelper args={[5]} />
          <gridHelper />
        </ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
