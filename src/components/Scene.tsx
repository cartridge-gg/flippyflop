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
  initialCameraPos?: [number, number]
}

const useCameraLerp = (cameraRef: React.RefObject<Camera>, targetPosition?: [number, number], targetZoom?: number) => {
  const targetRef = useRef(targetPosition)
  const targetZoomRef = useRef(targetZoom)

  useEffect(() => {
    if (targetPosition) {
      targetRef.current = new Vector3(targetPosition[0], 200, targetPosition[1])
    }
  }, [targetPosition])

  useEffect(() => {
    if (targetZoom) {
      targetZoomRef.current = targetZoom
    }
  }, [targetZoom])

  useFrame(() => {
    if (!cameraRef.current) return

    if (targetRef.current && cameraRef.current.position.distanceTo(targetRef.current) < 0.1) targetRef.current = null
    if (cameraRef.current.zoom - targetZoomRef.current < 0.1) targetZoomRef.current = null
    if (targetRef.current) cameraRef.current.position.lerp(targetRef.current, 0.05)
    if (targetZoomRef.current) cameraRef.current.zoom = lerp(cameraRef.current.zoom, targetZoomRef.current ?? 80, 0.05)
  })
}

const Scene = ({
  tiles,
  cameraTargetPosition,
  cameraTargetZoom,
  cameraRef = useRef<Camera>(null),
  initialCameraPos,
}: SceneProps) => {
  useCameraLerp(cameraRef, cameraTargetPosition, cameraTargetZoom)

  return (
    <>
      <color attach='background' args={['#9c9c9c']} />
      <ambientLight />
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        // position={[initialCameraPos[0] + 200, 200, initialCameraPos[1] + 200]}
        zoom={80}
      />
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
