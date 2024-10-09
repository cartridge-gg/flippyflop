import { CameraControls, Hud, OrthographicCamera, Stats } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import Chunks from './Chunks'
import { CHUNK_SIZE, WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'
import { OrthographicCamera as Camera, Scene as ThreeScene } from 'three'
import { useEffect, useRef, useState } from 'react'
import CameraControlsImpl from 'camera-controls'
import React from 'react'
import Minimap from './Minimap'

interface SceneProps {
  tiles: Record<string, Tile>
  setTiles: React.Dispatch<React.SetStateAction<Record<string, Tile>>>
  cameraRef?: React.RefObject<Camera>
  controlsRef?: React.RefObject<CameraControls>
  sceneRef?: React.MutableRefObject<ThreeScene>
  initialCameraPos?: [number, number]
  playFlipSound: () => void
}

const calculateZoomBounds = (currentZoom?: number, controls?: CameraControls) => {
  const baseWidth = 1656
  const baseHeight = 1225
  const baseMinZoom = 700
  const baseMaxZoom = 200

  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  const scaleFactor = Math.max(windowWidth / baseWidth, windowHeight / baseHeight)

  const minZoom = (baseMinZoom * scaleFactor) / CHUNK_SIZE
  const maxZoom = baseMaxZoom * scaleFactor

  const zoom = currentZoom ? Math.max((currentZoom * scaleFactor) / CHUNK_SIZE, minZoom) : (minZoom + maxZoom) / 4
  controls?.zoomTo(zoom, true)

  return {
    minZoom,
    maxZoom,
    zoom,
  }
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
  const [zoomBounds, setZoomBounds] = useState(calculateZoomBounds())

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
    // Add event listener for window resize
    window.addEventListener('resize', () =>
      setZoomBounds((prev) => calculateZoomBounds(prev.zoom, controlsRef.current)),
    )

    // Cleanup
    return () =>
      window.removeEventListener('resize', () =>
        setZoomBounds((prev) => calculateZoomBounds(prev.zoom, controlsRef.current)),
      )
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
        zoom={(zoomBounds.minZoom + zoomBounds.maxZoom) / 4}
        makeDefault
        position={[cameraX, h, cameraZ]}
        near={0}
        far={100000}
      />
      <Chunks entities={tiles} playFlipSound={playFlipSound} setTiles={setTiles} />
      <CameraControls
        ref={controlsRef}
        minZoom={zoomBounds.minZoom}
        maxZoom={zoomBounds.maxZoom}
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
      <Hud>
        {/* <Minimap tiles={tiles} cameraRef={cameraRef} /> */}
        <OrthographicCamera position={[0, 0, 0]} makeDefault near={0} far={100000} />
      </Hud>
    </>
  )
}

export default Scene
