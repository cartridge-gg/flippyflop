'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { Ref, useEffect, useMemo, useRef, useState } from 'react'
import { Line, useCursor, MeshDistortMaterial } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import { Tile as TileModel } from 'src/models'

const ANIMATION_STATES = {
  IDLE: 'idle',
  JUMPING: 'jumping',
  FLIPPING: 'flipping',
  FALLING: 'falling',
}

export default function Tile({
  tile,
  size = 1,
  onClick,
}: {
  tile: TileModel
  size?: number
  onClick?: (x: number, y: number) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [animationState, setAnimationState] = useState(ANIMATION_STATES.IDLE)
  const [flipped, setFlipped] = useState(tile.flipped !== '0x0')
  const [animationProgress, setAnimationProgress] = useState(0)

  const jumpHeight = 0.5
  const animationDuration = 0.5 // seconds

  const frontTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const loadedTexture = loader.load('/textures/smiley.png')
    loadedTexture.magFilter = THREE.NearestFilter
    loadedTexture.minFilter = THREE.NearestFilter
    return loadedTexture
  }, [])

  const backTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const loadedTexture = loader.load('/textures/IMG_2280.jpg')
    loadedTexture.magFilter = THREE.NearestFilter
    loadedTexture.minFilter = THREE.NearestFilter
    return loadedTexture
  }, [])

  useEffect(() => {
    if (tile.flipped !== '0x0' && !flipped) {
      setFlipped(true)
      setAnimationState(ANIMATION_STATES.JUMPING)
      setAnimationProgress(0)
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
        setAnimationProgress((prev) => prev + delta / animationDuration)
        group.rotation.x = THREE.MathUtils.lerp(0, Math.PI, animationProgress)
        if (animationProgress >= 1) {
          setAnimationState(ANIMATION_STATES.FALLING)
          setAnimationProgress(0)
        }
        break

      case ANIMATION_STATES.FALLING:
        setAnimationProgress((prev) => prev + delta / animationDuration)
        group.position.y = THREE.MathUtils.lerp(jumpHeight * (1 - animationProgress), 0, animationProgress)
        if (animationProgress >= 1) {
          setAnimationState(ANIMATION_STATES.IDLE)
          group.position.y = 0
        }
        break

      case ANIMATION_STATES.IDLE:
        // Add a subtle floating effect when idle
        group.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05
        break
    }
  })

  return (
    <group ref={groupRef} position={[tile.x * 1.25, 0, tile.y * 1.25]} onClick={() => onClick?.(tile.x, tile.y)}>
      <mesh>
        <boxGeometry args={[size, size * 0.2, size]} />
        <meshStandardMaterial color={flipped ? '#F38333' : '#4C5B69'} />
      </mesh>
      <mesh position={[0, size * 0.1 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={frontTexture} transparent />
      </mesh>
      <mesh position={[0, -size * 0.1 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={backTexture} transparent />
      </mesh>
    </group>
  )
}

// export default function Tile({ tile, onClick, ...props }: { tile: TileModel; onClick: () => void }) {
//   const flipped = tile.flipped != '0x0'
//   const [hovered, setHovered] = useState(false)
//   const meshRef: Ref<
//     THREE.Mesh<
//       THREE.BufferGeometry<THREE.NormalBufferAttributes>,
//       THREE.Material | THREE.Material[],
//       THREE.Object3DEventMap
//     >
//   > = useRef()

//   useCursor(hovered)

//   useFrame((state, delta) => {
//     if (meshRef.current) {
//       meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, flipped ? Math.PI : 0, 0.1)
//     }
//   })

//   return (
//     <group position={[tile.x, tile.y, 0]} {...props}>
//       <mesh
//         ref={meshRef}
//         onClick={onClick}
//         onPointerOver={() => setHovered(true)}
//         onPointerOut={() => setHovered(false)}
//       >
//         <boxGeometry args={[1, 1, 0.1]} />
//         <meshStandardMaterial color={flipped || hovered ? 'hotpink' : '#1fb2f5'} />
//       </mesh>
//       {/* Back side of the tile */}
//       <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
//         <boxGeometry args={[1, 1, 0.01]} />
//         <meshStandardMaterial color='#f1f1f1' />
//       </mesh>
//     </group>
//   )
// }
