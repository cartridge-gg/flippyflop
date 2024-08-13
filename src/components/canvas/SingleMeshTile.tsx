'use client'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { RoundedBox, useCursor } from '@react-three/drei'
import { Tile as TileModel } from 'src/models'
import { TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'
import dynamic from 'next/dynamic'

const PlusOneAnimation = dynamic(() => import('./PlusOneAnimation').then((mod) => mod.default), {
  ssr: false,
})

const ANIMATION_STATES = {
  IDLE: 'idle',
  JUMPING: 'jumping',
  FLIPPING: 'flipping',
  FALLING: 'falling',
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 tileColor;
  uniform sampler2D frontTexture;
  uniform sampler2D backTexture;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec4 texColor;
    if (vNormal.y > 0.5) {
      texColor = texture2D(frontTexture, vUv);
    } else if (vNormal.y < -0.5) {
      texColor = texture2D(backTexture, vUv);
    } else {
      texColor = vec4(tileColor, 1.0);
    }
    
    // Blend the texture color with the tile color
    gl_FragColor = vec4(mix(tileColor, texColor.rgb, texColor.a), 1.0);
  }
`

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
  const meshRef = useRef<THREE.Mesh>(null)
  const [animationState, setAnimationState] = useState(ANIMATION_STATES.IDLE)
  const [flipped, setFlipped] = useState(tile.flipped !== '0x0')
  const [animationProgress, setAnimationProgress] = useState(0)
  const [hoverProgress, setHoverProgress] = useState(0)
  const [targetColor, setTargetColor] = useState(flipped ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR)
  const [showPlusOne, setShowPlusOne] = useState(false)
  const [isReversing, setIsReversing] = useState(false)
  const [hovered, setHovered] = useState(false)

  const jumpHeight = 0.5
  const hoverHeight = 0.1
  const animationDuration = 0.5 // seconds
  const hoverAnimationDuration = 0.3 // seconds

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tileColor: { value: new THREE.Color(targetColor) },
        frontTexture: { value: frontTexture },
        backTexture: { value: backTexture },
      },
    })
  }, [frontTexture, backTexture])

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
    if (!meshRef.current) return

    const mesh = meshRef.current

    switch (animationState) {
      case ANIMATION_STATES.JUMPING:
        setAnimationProgress((prev) => prev + delta / animationDuration)
        mesh.position.y = jumpHeight * Math.sin(animationProgress * Math.PI)
        if (animationProgress >= 0.5) {
          setAnimationState(ANIMATION_STATES.FLIPPING)
          setAnimationProgress(0)
        }
        break

      case ANIMATION_STATES.FLIPPING:
        setShowPlusOne(false)
        setAnimationProgress((prev) => prev + delta / animationDuration)
        mesh.rotation.x = isReversing
          ? THREE.MathUtils.lerp(Math.PI, 0, animationProgress)
          : THREE.MathUtils.lerp(0, Math.PI, animationProgress)
        if (animationProgress >= 0.8) {
          shaderMaterial.uniforms.tileColor.value.set(targetColor)
        }
        if (animationProgress >= 1) {
          setAnimationState(ANIMATION_STATES.FALLING)
          setAnimationProgress(0)
        }
        break

      case ANIMATION_STATES.FALLING:
        setAnimationProgress((prev) => prev + delta / animationDuration)
        if (animationProgress < 0.7) {
          mesh.position.y = THREE.MathUtils.lerp(jumpHeight, -0.1, animationProgress / 0.7)
        } else {
          const bounceProgress = (animationProgress - 0.7) / 0.3
          mesh.position.y = THREE.MathUtils.lerp(-0.1, 0, bounceProgress)
        }
        if (animationProgress >= 1) {
          setAnimationState(ANIMATION_STATES.IDLE)
          mesh.position.y = 0
          mesh.rotation.x = isReversing ? 0 : Math.PI
        }
        break

      case ANIMATION_STATES.IDLE:
        if (hovered && hoverProgress < 1) {
          setHoverProgress((prev) => Math.min(prev + delta / hoverAnimationDuration, 1))
        } else if (!hovered && hoverProgress > 0) {
          setHoverProgress((prev) => Math.max(prev - delta / hoverAnimationDuration, 0))
        }

        const hoverOffset = THREE.MathUtils.lerp(0, hoverHeight, hoverProgress)
        const sineOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05
        const targetY = hoverOffset + sineOffset

        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 1 - Math.pow(0.001, delta))
        break
    }
  })

  useCursor(hovered)
  return (
    <group position={[tile.x * 1.1, 10, tile.y * 1.1]}>
      <mesh
        ref={meshRef}
        onClick={() => {
          onClick?.(tile)
          if (animationState !== ANIMATION_STATES.IDLE) return
          setShowPlusOne(!flipped)
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        material={shaderMaterial}
      >
        <boxGeometry args={[size * 0.95, size * 0.1, size * 0.95]} />
      </mesh>
      {showPlusOne && <PlusOneAnimation position={[0, size * 0.05 + 0.2, 0]} />}
    </group>
  )
}
