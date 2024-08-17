'use client'

import { RoundedBox, useCursor, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Tile as TileModel } from 'src/models'
import { TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'
import PlusOneAnimation from './PlusOneAnimation'
import { RoundedBoxGeometry } from 'three-stdlib'

const ANIMATION_STATES = {
  IDLE: 'idle',
  JUMPING: 'jumping',
  FLIPPING: 'flipping',
  FALLING: 'falling',
}

const TILE_SIZE = 1
const geom = new RoundedBoxGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.1, TILE_SIZE * 0.95, undefined, 4)

export default function Tile({
  tiles,
  frontTexture,
  backTexture,
  size = 1,
  onClick,
}: {
  tiles: TileModel[]
  frontTexture: THREE.Texture
  backTexture: THREE.Texture
  size?: number
  onClick?: (tile: TileModel) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const boxMeshRef = useRef<THREE.InstancedMesh>(null)
  const frontMeshRef = useRef<THREE.InstancedMesh>(null)
  const backMeshRef = useRef<THREE.InstancedMesh>(null)

  const [animationStates, setAnimationStates] = useState(() => tiles.map(() => ANIMATION_STATES.IDLE))
  const [flippedStates, setFlippedStates] = useState(() => tiles.map((tile) => tile.flipped !== '0x0'))
  const [hoverProgresses, setHoverProgresses] = useState(() => tiles.map(() => 0))
  const [tileColors, setTileColors] = useState(() =>
    tiles.map((tile) => (tile.flipped !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR)),
  )
  const [targetColors, setTargetColors] = useState(() =>
    tiles.map((tile) => (tile.flipped !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR)),
  )
  const [showPlusOnes, setShowPlusOnes] = useState(() => tiles.map(() => false))
  const [hoveredIndices, setHoveredIndices] = useState(() => tiles.map(() => false))

  const jumpHeight = 0.5
  const hoverHeight = 0.1
  const animationDuration = 0.5 // seconds
  const hoverAnimationDuration = 0.3 // seconds

  useEffect(() => {
    const newFlippedStates = tiles.map((tile) => tile.flipped !== '0x0')
    setFlippedStates(newFlippedStates)
    setTargetColors(newFlippedStates.map((flipped) => (flipped ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR)))
    setAnimationStates(newFlippedStates.map((flipped) => (flipped ? ANIMATION_STATES.JUMPING : ANIMATION_STATES.IDLE)))
  }, [tiles])

  useFrame((state, delta) => {
    if (!boxMeshRef.current || !frontMeshRef.current || !backMeshRef.current || !groupRef.current) return

    const group = groupRef.current

    tiles.forEach((tile, i) => {
      let animationState = animationStates[i]
      let animationProgress = 0

      switch (animationState) {
        case ANIMATION_STATES.JUMPING:
          animationProgress += delta / animationDuration
          group.position.y = jumpHeight * Math.sin(animationProgress * Math.PI)
          if (animationProgress >= 0.5) {
            animationState = ANIMATION_STATES.FLIPPING
            animationProgress = 0
          }
          break

        case ANIMATION_STATES.FLIPPING:
          showPlusOnes[i] = false
          animationProgress += delta / animationDuration
          group.rotation.x = flippedStates[i]
            ? THREE.MathUtils.lerp(Math.PI, 0, animationProgress)
            : THREE.MathUtils.lerp(0, Math.PI, animationProgress)
          if (animationProgress >= 0.8) tileColors[i] = targetColors[i]
          if (animationProgress >= 1) {
            animationState = ANIMATION_STATES.FALLING
            animationProgress = 0
          }
          break

        case ANIMATION_STATES.FALLING:
          animationProgress += delta / animationDuration
          if (animationProgress < 0.7) {
            group.position.y = THREE.MathUtils.lerp(jumpHeight, -0.1, animationProgress / 0.7)
          } else {
            const bounceProgress = (animationProgress - 0.7) / 0.3
            group.position.y = THREE.MathUtils.lerp(-0.1, 0, bounceProgress)
          }
          if (animationProgress >= 1) {
            animationState = ANIMATION_STATES.IDLE
            group.position.y = 0
            group.rotation.x = flippedStates[i] ? 0 : Math.PI
          }
          break

        case ANIMATION_STATES.IDLE:
          if (hoveredIndices[i] && hoverProgresses[i] < 1) {
            hoverProgresses[i] = Math.min(hoverProgresses[i] + delta / hoverAnimationDuration, 1)
          } else if (!hoveredIndices[i] && hoverProgresses[i] > 0) {
            hoverProgresses[i] = Math.max(hoverProgresses[i] - delta / hoverAnimationDuration, 0)
          }

          const hoverOffset = THREE.MathUtils.lerp(0, hoverHeight, hoverProgresses[i])
          const sineOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05
          const targetY = hoverOffset + sineOffset

          const matrix = new THREE.Matrix4().makeTranslation(tile.x * 1.1, targetY, tile.y * 1.1)
          boxMeshRef.current.setMatrixAt(i, matrix)
          frontMeshRef.current.setMatrixAt(i, matrix)
          backMeshRef.current.setMatrixAt(i, matrix)
          break
      }

      boxMeshRef.current.setColorAt(i, new THREE.Color(tileColors[i]))
    })

    boxMeshRef.current.instanceMatrix.needsUpdate = true
    frontMeshRef.current.instanceMatrix.needsUpdate = true
    backMeshRef.current.instanceMatrix.needsUpdate = true

    boxMeshRef.current.instanceColor!.needsUpdate = true
  })

  useCursor(hoveredIndices.some((hovered) => hovered))

  return (
    <group ref={groupRef}>
      <instancedMesh ref={boxMeshRef} args={[null, null, tiles.length]}>
        <boxGeometry args={[size * 0.95, size * 0.1, size * 0.95]} />
        <meshStandardMaterial />
      </instancedMesh>

      <instancedMesh ref={frontMeshRef} args={[null, null, tiles.length]}>
        <planeGeometry args={[size * 0.95, size * 0.95]} />
        <meshBasicMaterial map={frontTexture} transparent />
      </instancedMesh>

      <instancedMesh ref={backMeshRef} args={[null, null, tiles.length]}>
        <planeGeometry args={[size * 0.95, size * 0.95]} />
        <meshBasicMaterial map={backTexture} transparent />
      </instancedMesh>

      {showPlusOnes.map(
        (show, i) =>
          show && <PlusOneAnimation key={i} position={[tiles[i].x * 1.1, size * 0.05 + 0.2, tiles[i].y * 1.1]} />,
      )}
    </group>
  )
}
