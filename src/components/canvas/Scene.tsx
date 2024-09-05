import { CameraControls, MapControls, OrthographicCamera, Stats } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import Chunks from './Chunks'
import { WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'
import { NoToneMapping, OrthographicCamera as Camera, Vector3 } from 'three'
import { useRef, useEffect } from 'react'
import { lerp } from 'three/src/math/MathUtils'

interface SceneProps {
  tiles: Record<string, Tile>
  cameraRef?: React.RefObject<Camera>
  initialCameraPos?: [number, number]
  playFlipSound: () => void
}

const Scene = ({ tiles, cameraRef = useRef<Camera>(null), initialCameraPos = [0, 0], playFlipSound }: SceneProps) => {
  return (
    <>
      <color attach='background' args={['#9c9c9c']} />
      <ambientLight />
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={[initialCameraPos[0] + 200, 200, initialCameraPos[1] + 200]}
        zoom={80}
      />
      {/* <Stats /> */}
      <Chunks entities={tiles} playFlipSound={playFlipSound} />
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
