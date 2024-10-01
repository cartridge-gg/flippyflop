import { CameraControls, OrthographicCamera, Stats } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Chunks from './Chunks'
import { CHUNK_SIZE, WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'
import { OrthographicCamera as Camera, Scene as ThreeScene } from 'three'
import { useEffect, useRef, useState } from 'react'
import CameraControlsImpl from 'camera-controls'

interface SceneProps {
  tiles: Record<string, Tile>
  setTiles: React.Dispatch<React.SetStateAction<Record<string, Tile>>>
  cameraRef?: React.RefObject<Camera>
  controlsRef?: React.RefObject<CameraControls>
  sceneRef?: React.MutableRefObject<ThreeScene>
  initialCameraPos?: [number, number]
  playFlipSound: () => void
}

const Scene = ({
  tiles,
  setTiles,
  cameraRef = useRef<Camera>(null),
  controlsRef = useRef<CameraControls>(null),
  sceneRef = useRef<ThreeScene>(null),
  initialCameraPos = [0, 0],
  playFlipSound,
}: SceneProps) => {
  const { gl, scene } = useThree()
  const [minZoom, setMinZoom] = useState(700 / CHUNK_SIZE)

  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!controlsRef.current) return

      const moveDistance = 3 // Adjust this value to change movement speed
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
          controlsRef.current.truck(0, -moveDistance, true)
          break
        case 'ArrowDown':
        case 's':
          controlsRef.current.truck(0, moveDistance, true)
          break
        case 'ArrowLeft':
        case 'a':
          controlsRef.current.truck(-moveDistance, 0, true)
          break
        case 'ArrowRight':
        case 'd':
          controlsRef.current.truck(moveDistance, 0, true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const updateMinZoom = () => {
      const baseWidth = 1656
      const baseHeight = 1225
      const baseMinZoom = 700

      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      // Calculate the scaling factor based on the larger dimension
      const scaleFactor = Math.max(windowWidth / baseWidth, windowHeight / baseHeight)

      const minZoom = (baseMinZoom * scaleFactor) / CHUNK_SIZE
      setMinZoom(minZoom)
    }

    // Initial update
    updateMinZoom()

    // Add event listener for window resize
    window.addEventListener('resize', updateMinZoom)

    // Cleanup
    return () => window.removeEventListener('resize', updateMinZoom)
  }, [])

  const h = 500
  const cameraX = initialCameraPos[0] + h
  const cameraZ = initialCameraPos[1] + h

  return (
    <>
      <color attach='background' args={['#9c9c9c']} />
      <ambientLight />
      {/* <Stats /> */}
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        zoom={80}
        position={[cameraX, h, cameraZ]}
        near={0}
        far={100000}
      />
      <Chunks entities={tiles} playFlipSound={playFlipSound} setTiles={setTiles} />
      <CameraControls
        ref={controlsRef}
        // minZoom={10}
        // magic number to keep camera zoomed enough
        // to not see unloaded chunks
        // this magic number is based on the window size. it works
        // for 1656x1225 window
        minZoom={minZoom}
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
