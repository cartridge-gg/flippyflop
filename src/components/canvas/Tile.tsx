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

// wip

// interface TileInstancesProps {
//   tiles: TileModel[]
//   size?: number
//   onClick?: (x: number, y: number) => void
// }

// export const TileInstances: React.FC<TileInstancesProps> = ({ tiles, size = 1, onClick }) => {
//   const meshRef = useRef<THREE.InstancedMesh>(null)
//   const frontTextureRef = useRef<THREE.InstancedMesh>(null)
//   const backTextureRef = useRef<THREE.InstancedMesh>(null)
//   const [hovered, setHovered] = useState<number | null>(null)
//   const [animationStates, setAnimationStates] = useState<string[]>([])
//   const [animationProgresses, setAnimationProgresses] = useState<number[]>([])
//   const [hoverProgresses, setHoverProgresses] = useState<number[]>([])
//   const [flipped, setFlipped] = useState<boolean[]>([])
//   const [colors, setColors] = useState<THREE.Color[]>([])

//   const jumpHeight = 0.5
//   const hoverHeight = 0.1
//   const animationDuration = 0.5 // seconds
//   const hoverAnimationDuration = 0.3 // seconds

//   const dummy = useMemo(() => new THREE.Object3D(), [])
//   const dummyFront = useMemo(() => new THREE.Object3D(), [])
//   const dummyBack = useMemo(() => new THREE.Object3D(), [])

//   const frontTexture = useMemo(() => {
//     const loader = new THREE.TextureLoader()
//     const loadedTexture = loader.load('/textures/smiley.png')
//     loadedTexture.magFilter = THREE.NearestFilter
//     loadedTexture.minFilter = THREE.NearestFilter
//     return loadedTexture
//   }, [])

//   const backTexture = useMemo(() => {
//     const loader = new THREE.TextureLoader()
//     const loadedTexture = loader.load('/textures/IMG_2280.jpg')
//     loadedTexture.magFilter = THREE.NearestFilter
//     loadedTexture.minFilter = THREE.NearestFilter
//     return loadedTexture
//   }, [])

//   useEffect(() => {
//     setAnimationStates(tiles.map(() => ANIMATION_STATES.IDLE))
//     setAnimationProgresses(tiles.map(() => 0))
//     setHoverProgresses(tiles.map(() => 0))
//     setFlipped(tiles.map((tile) => tile.flipped !== '0x0'))
//     setColors(tiles.map(() => new THREE.Color('#4C5B69')))
//   }, [tiles])

//   useEffect(() => {
//     tiles.forEach((tile, index) => {
//       if (tile.flipped !== '0x0' && !flipped[index]) {
//         setFlipped((prev) => {
//           const newFlipped = [...prev]
//           newFlipped[index] = true
//           return newFlipped
//         })
//         setColors((prev) => {
//           const newColors = [...prev]
//           newColors[index] = new THREE.Color('#F38333')
//           return newColors
//         })
//         setAnimationStates((prev) => {
//           const newStates = [...prev]
//           newStates[index] = ANIMATION_STATES.JUMPING
//           return newStates
//         })
//         setAnimationProgresses((prev) => {
//           const newProgresses = [...prev]
//           newProgresses[index] = 0
//           return newProgresses
//         })
//       }
//     })
//   }, [tiles, flipped])

//   useFrame((state, delta) => {
//     if (!meshRef.current || !frontTextureRef.current || !backTextureRef.current) return

//     tiles.forEach((tile, index) => {
//       dummy.position.set(tile.x * 1.25, 0, tile.y * 1.25)
//       dummyFront.position.set(tile.x * 1.25, size * 0.1 + 0.001, tile.y * 1.25)
//       dummyBack.position.set(tile.x * 1.25, -size * 0.1 - 0.001, tile.y * 1.25)

//       let yPosition = 0
//       let xRotation = 0

//       switch (animationStates[index]) {
//         case ANIMATION_STATES.JUMPING:
//           setAnimationProgresses((prev) => {
//             const newProgresses = [...prev]
//             newProgresses[index] += delta / animationDuration
//             return newProgresses
//           })
//           yPosition = jumpHeight * Math.sin(animationProgresses[index] * Math.PI)
//           if (animationProgresses[index] >= 0.5) {
//             setAnimationStates((prev) => {
//               const newStates = [...prev]
//               newStates[index] = ANIMATION_STATES.FLIPPING
//               return newStates
//             })
//             setAnimationProgresses((prev) => {
//               const newProgresses = [...prev]
//               newProgresses[index] = 0
//               return newProgresses
//             })
//           }
//           break

//         case ANIMATION_STATES.FLIPPING:
//           setAnimationProgresses((prev) => {
//             const newProgresses = [...prev]
//             newProgresses[index] += delta / animationDuration
//             return newProgresses
//           })
//           xRotation = THREE.MathUtils.lerp(0, Math.PI, animationProgresses[index])
//           yPosition = jumpHeight
//           if (animationProgresses[index] >= 0.8) {
//             setColors((prev) => {
//               const newColors = [...prev]
//               newColors[index] = new THREE.Color('#F38333')
//               return newColors
//             })
//           }
//           if (animationProgresses[index] >= 1) {
//             setAnimationStates((prev) => {
//               const newStates = [...prev]
//               newStates[index] = ANIMATION_STATES.FALLING
//               return newStates
//             })
//             setAnimationProgresses((prev) => {
//               const newProgresses = [...prev]
//               newProgresses[index] = 0
//               return newProgresses
//             })
//           }
//           break

//         case ANIMATION_STATES.FALLING:
//           setAnimationProgresses((prev) => {
//             const newProgresses = [...prev]
//             newProgresses[index] += delta / animationDuration
//             return newProgresses
//           })
//           yPosition = THREE.MathUtils.lerp(jumpHeight, 0, animationProgresses[index])
//           if (animationProgresses[index] >= 1) {
//             setAnimationStates((prev) => {
//               const newStates = [...prev]
//               newStates[index] = ANIMATION_STATES.IDLE
//               return newStates
//             })
//           }
//           break

//         case ANIMATION_STATES.IDLE:
//           if (index === hovered && hoverProgresses[index] < 1) {
//             setHoverProgresses((prev) => {
//               const newProgresses = [...prev]
//               newProgresses[index] = Math.min(prev[index] + delta / hoverAnimationDuration, 1)
//               return newProgresses
//             })
//           } else if (index !== hovered && hoverProgresses[index] > 0) {
//             setHoverProgresses((prev) => {
//               const newProgresses = [...prev]
//               newProgresses[index] = Math.max(prev[index] - delta / hoverAnimationDuration, 0)
//               return newProgresses
//             })
//           }

//           yPosition =
//             THREE.MathUtils.lerp(0, hoverHeight, hoverProgresses[index]) + Math.sin(state.clock.elapsedTime * 2) * 0.05
//           break
//       }

//       dummy.position.y += yPosition
//       dummy.rotation.x = xRotation
//       dummy.updateMatrix()
//       meshRef.current.setMatrixAt(index, dummy.matrix)
//       meshRef.current.setColorAt(index, colors[index])

//       dummyFront.position.y += yPosition
//       dummyFront.rotation.x = -Math.PI / 2 + xRotation
//       dummyFront.updateMatrix()
//       frontTextureRef.current.setMatrixAt(index, dummyFront.matrix)

//       dummyBack.position.y += yPosition
//       dummyBack.rotation.x = Math.PI / 2 + xRotation
//       dummyBack.updateMatrix()
//       backTextureRef.current.setMatrixAt(index, dummyBack.matrix)

//       const isFrontVisible = Math.sin(xRotation) >= 0
//       frontTextureRef.current.setColorAt(index, new THREE.Color(isFrontVisible ? 1 : 0))
//       backTextureRef.current.setColorAt(index, new THREE.Color(isFrontVisible ? 0 : 1))
//     })

//     meshRef.current.instanceMatrix.needsUpdate = true
//     meshRef.current.instanceColor!.needsUpdate = true
//     frontTextureRef.current.instanceMatrix.needsUpdate = true
//     frontTextureRef.current.instanceColor!.needsUpdate = true
//     backTextureRef.current.instanceMatrix.needsUpdate = true
//     backTextureRef.current.instanceColor!.needsUpdate = true
//   })

//   useCursor(hovered !== null)

//   return (
//     <>
//       <instancedMesh
//         ref={meshRef}
//         args={[undefined, undefined, tiles.length]}
//         onPointerMove={(e) => {
//           e.stopPropagation()
//           setHovered(e.instanceId ?? null)
//         }}
//         onPointerOut={() => setHovered(null)}
//         onClick={(e) => {
//           if (e.instanceId !== undefined) {
//             const tile = tiles[e.instanceId]
//             onClick?.(tile.x, tile.y)
//           }
//         }}
//       >
//         <boxGeometry args={[size, size * 0.2, size]} />
//         <meshStandardMaterial />
//       </instancedMesh>
//       <instancedMesh ref={frontTextureRef} args={[undefined, undefined, tiles.length]}>
//         <planeGeometry args={[size, size]} />
//         <meshBasicMaterial map={frontTexture} transparent />
//       </instancedMesh>
//       <instancedMesh ref={backTextureRef} args={[undefined, undefined, tiles.length]}>
//         <planeGeometry args={[size, size]} />
//         <meshBasicMaterial map={backTexture} transparent />
//       </instancedMesh>
//     </>
//   )
// }
