import { CameraControls, Hud, OrthographicCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import CameraControlsImpl from 'camera-controls'
import { useEffect, useRef, useState } from 'react'
import React from 'react'

import Chunks from './Chunks'
import Minimap from './Minimap'
import { CHUNK_SIZE } from '@/constants'

import type { Tile } from '@/models'
import type { Scene as ThreeScene, OrthographicCamera as Camera } from 'three'

// Add this custom hook at the top of the file, outside of the Scene component
const useShowMinimap = () => {
  const [showMinimap, setShowMinimap] = useState(true)

  useEffect(() => {
    const checkDimensions = () => {
      const isMobile = window.innerWidth <= 768
      const isShortScreen = window.innerHeight <= 700
      setShowMinimap(!isMobile && !isShortScreen)
    }

    checkDimensions()
    window.addEventListener('resize', checkDimensions)

    return () => window.removeEventListener('resize', checkDimensions)
  }, [])

  return showMinimap
}

interface SceneProps {
  tiles: Record<string, Tile>
  updateTile: (tile: Tile) => () => void
  selectedTeam: number
  cameraRef?: React.RefObject<Camera>
  controlsRef?: React.RefObject<CameraControls>
  sceneRef?: React.MutableRefObject<ThreeScene>
  initialCameraPos?: [number, number]
  playFlipSound: () => void
  timeRange: [number, number]
  isLoading: boolean
}

const calculateZoomBounds = (currentZoom?: number, controls?: CameraControls) => {
  const baseWidth = 1656
  const baseHeight = 1225
  const baseMinZoom = 620
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
  updateTile,
  selectedTeam,
  cameraRef = useRef<Camera>(null),
  controlsRef = useRef<CameraControls>(null),
  sceneRef = useRef<ThreeScene>(null),
  initialCameraPos = [0, 0],
  playFlipSound,
  timeRange,
  isLoading,
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

  const showMinimap = useShowMinimap()

  useEffect(() => {
    if (!controlsRef.current) return
    setTimeout(() => {
      controlsRef.current.truck(Math.random() * 1000 - 500, Math.random() * 1000 - 500, false)
    }, 0)
  }, [])

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
      <Chunks
        entities={tiles}
        playFlipSound={playFlipSound}
        updateTile={updateTile}
        selectedTeam={selectedTeam}
        timeRange={timeRange}
        isLoading={isLoading}
      />
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
      <Hud renderPriority={2}>
        {showMinimap && <Minimap tiles={tiles} cameraRef={cameraRef} selectedTeam={selectedTeam} />}
        <OrthographicCamera position={[0, 0, 0]} makeDefault near={0} far={100000} />
      </Hud>
      <EffectComposer>
        <Bloom
          blendFunction={10}
          kernelSize={5}
          intensity={0.6}
          luminanceThreshold={0.4}
          luminanceSmoothing={1.5}
          resolutionScale={0.1}
        />
      </EffectComposer>
    </>
  )
}

export default Scene
