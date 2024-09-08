import { CameraControls, OrthographicCamera, Stats } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Chunks from './Chunks'
import { WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'
import { OrthographicCamera as Camera, Scene as ThreeScene } from 'three'
import { useEffect, useRef } from 'react'
import CameraControlsImpl from 'camera-controls'

interface SceneProps {
  tiles: Record<string, Tile>
  cameraRef?: React.RefObject<Camera>
  controlsRef?: React.RefObject<CameraControls>
  sceneRef?: React.MutableRefObject<ThreeScene>
  initialCameraPos?: [number, number]
  playFlipSound: () => void
}

const Scene = ({
  tiles,
  cameraRef = useRef<Camera>(null),
  controlsRef = useRef<CameraControls>(null),
  sceneRef = useRef<ThreeScene>(null),
  initialCameraPos = [0, 0],
  playFlipSound,
}: SceneProps) => {
  const { gl, scene } = useThree()

  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

  const h = 500
  const cameraX = initialCameraPos[0] + h
  const cameraZ = initialCameraPos[1] + h

  return (
    <>
      <color attach='background' args={['#9c9c9c']} />
      <ambientLight />
      <Stats />
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        zoom={80}
        position={[cameraX, h, cameraZ]}
        near={0}
        far={100000}
      />
      <Chunks entities={tiles} playFlipSound={playFlipSound} />
      <CameraControls
        ref={controlsRef}
        // minZoom={10}
        minZoom={35}
        maxZoom={200}
        verticalDragToForward={false}
        dollySpeed={10}
        mouseButtons={{
          left: CameraControlsImpl.ACTION.TRUCK,
          middle: CameraControlsImpl.ACTION.NONE,
          right: CameraControlsImpl.ACTION.NONE,
          wheel: CameraControlsImpl.ACTION.ZOOM,
        }}
        touches={{
          one: CameraControlsImpl.ACTION.TOUCH_TRUCK,
          two: CameraControlsImpl.ACTION.TOUCH_ZOOM,
          three: CameraControlsImpl.ACTION.NONE,
        }}
        camera={cameraRef.current}
      />
    </>
  )
}

export default Scene
