'use client'

import { RoundedBox, useGLTF } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { Ref, useEffect, useMemo, useRef, useState } from 'react'
import { Line, useCursor, MeshDistortMaterial } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import { Tile as TileModel } from 'src/models'
import { TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'
import PlusOneAnimation from './PlusOneAnimation'

const ANIMATION_STATES = {
  IDLE: 'idle',
  JUMPING: 'jumping',
  FLIPPING: 'flipping',
  FALLING: 'falling',
}

export default function Tile({
  tile,
  frontTexture,
  backTexture,
  size = 1,
  onClick,
}: {
  tile: TileModel
  frontTexture: THREE.Texture
  backTexture: THREE.Texture
  size?: number
  onClick?: (tile: TileModel) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [animationState, setAnimationState] = useState(ANIMATION_STATES.IDLE)
  const [flipped, setFlipped] = useState(tile.flipped !== '0x0')
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hoverProgress, setHoverProgress] = useState(0)
  const [tileColor, setTileColor] = useState(flipped ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR)
  const [targetColor, setTargetColor] = useState(tileColor)
  const [showPlusOne, setShowPlusOne] = useState(false)
  const [isReversing, setIsReversing] = useState(false)

  const [hovered, setHovered] = useState(false)

  const jumpHeight = 0.5
  const hoverHeight = 0.1
  const animationDuration = 0.5 // seconds
  const hoverAnimationDuration = 0.3 // seconds

  useEffect(() => {
    const newFlippedState = tile.flipped !== '0x0'
    if (newFlippedState !== flipped) {
      setFlipped(newFlippedState)
      setTargetColor(newFlippedState ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR)
      setAnimationState(ANIMATION_STATES.JUMPING)
      setAnimationProgress(0)
      setIsReversing(!newFlippedState)
    }
  }, [tile.flipped, flipped])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const group = groupRef.current

    switch (animationState) {
      case ANIMATION_STATES.JUMPING:
        setAnimationProgress((prev) => prev + delta / animationDuration)
        group.position.y = jumpHeight * Math.sin(animationProgress * Math.PI)
        if (animationProgress >= 0.5) {
          setAnimationState(ANIMATION_STATES.FLIPPING)
          setAnimationProgress(0)
        }
        break

      case ANIMATION_STATES.FLIPPING:
        setShowPlusOne(false)
        setAnimationProgress((prev) => prev + delta / animationDuration)
        group.rotation.x = isReversing
          ? THREE.MathUtils.lerp(Math.PI, 0, animationProgress)
          : THREE.MathUtils.lerp(0, Math.PI, animationProgress)
        if (animationProgress >= 0.8) setTileColor(targetColor)
        if (animationProgress >= 1) {
          setAnimationState(ANIMATION_STATES.FALLING)
          setAnimationProgress(0)
        }
        break

      case ANIMATION_STATES.FALLING:
        setAnimationProgress((prev) => prev + delta / animationDuration)
        if (animationProgress < 0.7) {
          group.position.y = THREE.MathUtils.lerp(jumpHeight, -0.1, animationProgress / 0.7)
        } else {
          const bounceProgress = (animationProgress - 0.7) / 0.3
          group.position.y = THREE.MathUtils.lerp(-0.1, 0, bounceProgress)
        }
        if (animationProgress >= 1) {
          setAnimationState(ANIMATION_STATES.IDLE)
          group.position.y = 0
          group.rotation.x = isReversing ? 0 : Math.PI
        }
        break

      case ANIMATION_STATES.IDLE:
        // Hover animation (unchanged)
        if (hovered && hoverProgress < 1) {
          setHoverProgress((prev) => Math.min(prev + delta / hoverAnimationDuration, 1))
        } else if (!hovered && hoverProgress > 0) {
          setHoverProgress((prev) => Math.max(prev - delta / hoverAnimationDuration, 0))
        }

        const hoverOffset = THREE.MathUtils.lerp(0, hoverHeight, hoverProgress)
        const sineOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05
        const targetY = hoverOffset + sineOffset

        group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, 1 - Math.pow(0.001, delta))
        break
    }
  })

  useCursor(hovered)

  return (
    <group
      ref={groupRef}
      position={[tile.x * 1.1, 10, tile.y * 1.1]}
      onClick={() => {
        onClick?.(tile)
        if (animationState !== ANIMATION_STATES.IDLE) return
        setShowPlusOne(!flipped)
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[size * 0.95, size * 0.1, size * 0.95]} radius={0.03} smoothness={4}>
        <meshStandardMaterial color={tileColor} />
      </RoundedBox>
      <mesh position={[0, size * 0.05 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 0.95, size * 0.95]} />
        <meshBasicMaterial map={frontTexture} transparent />
      </mesh>
      <mesh position={[0, -size * 0.05 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 0.95, size * 0.95]} />
        <meshBasicMaterial map={backTexture} transparent />
      </mesh>
      {showPlusOne && <PlusOneAnimation position={[0, size * 0.05 + 0.2, 0]} />}
    </group>
  )
}
