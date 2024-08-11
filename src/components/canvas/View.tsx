'use client'

import { forwardRef, Suspense, useImperativeHandle, useMemo, useRef } from 'react'
import { OrbitControls, PerspectiveCamera, View as ViewImpl, MapControls, OrthographicCamera } from '@react-three/drei'
import { Three } from '@/helpers/components/Three'

const WORLD_SIZE = 100
const WALL_HEIGHT = 10000
const WALL_THICKNESS = 10

const Wall = ({ position, size }) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial color='gray' />
  </mesh>
)

export const Common = ({ color }) => {
  const walls = useMemo(
    () => [
      // Bottom wall
      {
        position: [WORLD_SIZE / 2, -WALL_HEIGHT / 2, -WALL_THICKNESS / 2],
        size: [WORLD_SIZE + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS],
      },
      // Top wall
      {
        position: [WORLD_SIZE / 2, -WALL_HEIGHT / 2, WORLD_SIZE + WALL_THICKNESS / 2],
        size: [WORLD_SIZE + WALL_THICKNESS * 2, WALL_HEIGHT, WALL_THICKNESS],
      },
      // Left wall
      {
        position: [-WALL_THICKNESS / 2, -WALL_HEIGHT / 2, WORLD_SIZE / 2],
        size: [WALL_THICKNESS, WALL_HEIGHT, WORLD_SIZE + WALL_THICKNESS * 2],
      },
      // Right wall
      {
        position: [WORLD_SIZE + WALL_THICKNESS / 2, -WALL_HEIGHT / 2, WORLD_SIZE / 2],
        size: [WALL_THICKNESS, WALL_HEIGHT, WORLD_SIZE + WALL_THICKNESS * 2],
      },
    ],
    [],
  )

  return (
    <Suspense fallback={null}>
      {color && <color attach='background' args={[color]} />}
      <ambientLight />
      <OrthographicCamera makeDefault position={[200 + 10, 200 * 1.5, 200 + 10]} zoom={60} />
      {/* <fog attach='fog' args={['#f0f0f0', WORLD_SIZE * 0.8, WORLD_SIZE * 1.2]} /> */}
      {/* {walls.map((wall, index) => (
        <Wall key={index} position={wall.position} size={wall.size} />
      ))} */}
      {/* <OrthographicCamera makeDefault position={[30, 30, 30 * 1.4]} zoom={60} /> */}
    </Suspense>
  )
}

const View = forwardRef(({ children, orbit, ...props }, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>
          {children}
          {orbit && (
            <MapControls
              screenSpacePanning
              minZoom={20}
              maxZoom={100}
              maxPolarAngle={Math.PI / 2.5}
              minAzimuthAngle={-Math.PI / 4}
              maxAzimuthAngle={Math.PI / 4}
              minDistance={10}
              maxDistance={WORLD_SIZE}
            />
          )}
          <axesHelper position={[-1, 0, -1]} args={[10]} />
          <gridHelper position={[WORLD_SIZE / 2, 0, WORLD_SIZE / 2]} args={[WORLD_SIZE, WORLD_SIZE]} />
        </ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
