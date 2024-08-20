import { CameraControls, MapControls, OrthographicCamera, Stats } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import Chunks from './canvas/Chunks'
import { WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'
import { NoToneMapping, OrthographicCamera as Camera, Vector3 } from 'three'
import { useRef, useEffect } from 'react'
import { lerp } from 'three/src/math/MathUtils'

interface SceneProps {
  tiles: Record<string, Tile>
  cameraTargetPosition?: [number, number]
  cameraTargetZoom?: number
  cameraRef?: React.RefObject<Camera>
}

const useCameraLerp = (cameraRef: React.RefObject<Camera>, targetPosition?: [number, number], targetZoom?: number) => {
  const targetRef = useRef(new Vector3(200, 200, 200))
  const targetZoomRef = useRef(targetZoom)

  useEffect(() => {
    if (targetPosition) {
      targetRef.current.set(0, 50, 0)
      targetRef.current.x += targetPosition[0]
      targetRef.current.z += targetPosition[1]
    }
  }, [targetPosition])

  useEffect(() => {
    if (targetZoom) {
      targetZoomRef.current = targetZoom
    }
  }, [targetZoom])

  useFrame(() => {
    if (!cameraRef.current) return

    cameraRef.current.position.lerp(targetRef.current, 0.05)
    if (cameraRef.current.zoom - targetZoomRef.current < 0.1) targetZoomRef.current = null
    if (targetZoom) cameraRef.current.zoom = lerp(cameraRef.current.zoom, targetZoomRef.current ?? 80, 0.05)
  })
}

const Scene = ({ tiles, cameraTargetPosition, cameraTargetZoom, cameraRef = useRef<Camera>(null) }: SceneProps) => {
  useCameraLerp(cameraRef, cameraTargetPosition, cameraTargetZoom)

  return (
    <>
      <color attach='background' args={['#9c9c9c']} />
      <ambientLight />
      <OrthographicCamera ref={cameraRef} makeDefault position={[200, 200, 200]} zoom={80} />
      {/* <Stats /> */}
      <Chunks entities={tiles} />
      <MapControls
        enableRotate={false}
        minZoom={30}
        maxZoom={200}
        maxPolarAngle={Math.PI / 2.5}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
        minDistance={10}
        maxDistance={WORLD_SIZE}
      />
    </>
  )
}

export default Scene
