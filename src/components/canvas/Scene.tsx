import { CameraControls, OrthographicCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Chunks from './Chunks'
import { WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'
import { OrthographicCamera as Camera } from 'three'
import { useRef } from 'react'
import CameraControlsImpl from 'camera-controls'

interface SceneProps {
  tiles: Record<string, Tile>
  cameraRef?: React.RefObject<Camera>
  initialCameraPos?: [number, number]
  playFlipSound: () => void
}

const Scene = ({ tiles, cameraRef = useRef<Camera>(null), initialCameraPos = [0, 0], playFlipSound }: SceneProps) => {
  const controlsRef = useRef<CameraControls>(null)
  const { gl } = useThree()

  const h = 500
  const cameraX = initialCameraPos[0] + h
  const cameraZ = initialCameraPos[1] + h

  return (
    <>
      <color attach='background' args={['#9c9c9c']} />
      <ambientLight />
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        zoom={80}
        position={[cameraX, h, cameraZ]}
        near={0.1}
        far={1000}
      />
      <Chunks entities={tiles} playFlipSound={playFlipSound} />
      <CameraControls
        ref={controlsRef}
        minZoom={30}
        maxZoom={200}
        verticalDragToForward={false}
        dollySpeed={0.5}
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
