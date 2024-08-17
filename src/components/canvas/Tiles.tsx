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
import { RoundedBoxGeometry } from 'three-stdlib'

const ANIMATION_STATES = {
  IDLE: 'idle',
  JUMPING: 'jumping',
  FLIPPING: 'flipping',
  FALLING: 'falling',
}

const TILE_SIZE = 1
const geom = new RoundedBoxGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.1, TILE_SIZE * 0.95, undefined, 4)
const planeGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95)
const smileyColorMaterial = new THREE.MeshBasicMaterial({ color: TILE_SMILEY_SIDE_COLOR })
const robotColorMaterial = new THREE.MeshBasicMaterial({ color: TILE_ROBOT_SIDE_COLOR })

export default function Tiles({
  tiles,
  topMaterial,
  bottomMaterial,
  onClick,
}: {
  tiles: TileModel[]
  topMaterial: THREE.MeshBasicMaterial
  bottomMaterial: THREE.MeshBasicMaterial
  onClick?: (tile: TileModel) => void
}) {
  const roundedBoxRef = useRef<THREE.InstancedMesh>(null)
  const frontMeshRef = useRef<THREE.InstancedMesh>(null)
  const backMeshRef = useRef<THREE.InstancedMesh>(null)

  const [tilesState, setTilesState] = useState(() =>
    tiles.map((tile) => {
      return {
        position: new THREE.Vector3(tile.x * 1.1, 0, tile.y * 1.1),
        rotation: tile.flipped !== '0x0' ? new THREE.Euler(Math.PI, 0, 0) : new THREE.Euler(0, 0, 0),
        animationState: ANIMATION_STATES.IDLE,
        flipped: tile.flipped !== '0x0',
        animationProgress: 0,
        hoverProgress: 0,
        tileColor: tile.flipped !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR,
        targetColor: tile.flipped !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR,
        showPlusOne: false,
        isReversing: false,
        hovered: false,
      }
    }),
  )

  const jumpHeight = 0.5
  const hoverHeight = 0.1
  const animationDuration = 0.5 // seconds
  const hoverAnimationDuration = 0.3 // seconds

  const tempObject = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    setTilesState(
      tilesState.map((state, index) => {
        const newFlippedState = tiles[index].flipped !== '0x0'
        if (newFlippedState !== state.flipped) {
          state.flipped = newFlippedState
          state.targetColor = newFlippedState ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR
          state.animationState = ANIMATION_STATES.JUMPING
          state.animationProgress = 0
          state.isReversing = !newFlippedState
        }

        return state
      }),
    )
  }, [tilesState])

  useEffect(() => {
    console.log('tilesState', tilesState)
    tilesState.forEach((state, index) => {
      tempObject.position.copy(state.position)
      tempObject.rotation.copy(state.rotation)
      tempObject.updateMatrix()
      roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
      frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
      backMeshRef.current.setMatrixAt(index, tempObject.matrix)
    })

    roundedBoxRef.current.instanceMatrix.needsUpdate = true
    frontMeshRef.current.instanceMatrix.needsUpdate = true
    backMeshRef.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((three, delta) => {
    if (!roundedBoxRef.current || !frontMeshRef.current || !backMeshRef.current) return

    tilesState.forEach((state, index) => {
      switch (state.animationState) {
        case ANIMATION_STATES.JUMPING:
          state.animationProgress += delta / animationDuration
          state.position.y = jumpHeight * Math.sin(state.animationProgress * Math.PI)
          if (state.animationProgress >= 0.5) {
            state.animationState = ANIMATION_STATES.FLIPPING
            state.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FLIPPING:
          state.showPlusOne = false
          state.animationProgress += delta / animationDuration
          state.rotation.x = state.isReversing
            ? THREE.MathUtils.lerp(Math.PI, 0, state.animationProgress)
            : THREE.MathUtils.lerp(0, Math.PI, state.animationProgress)
          if (state.animationProgress >= 0.8) {
            state.tileColor = state.targetColor
            roundedBoxRef.current.setColorAt(index, new THREE.Color(state.tileColor))
            roundedBoxRef.current.instanceColor.needsUpdate = true
          }
          if (state.animationProgress >= 1) {
            state.animationState = ANIMATION_STATES.FALLING
            state.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FALLING:
          state.animationProgress += delta / animationDuration
          if (state.animationProgress < 0.7) {
            state.position.y = THREE.MathUtils.lerp(jumpHeight, -0.1, state.animationProgress / 0.7)
          } else {
            const bounceProgress = (state.animationProgress - 0.7) / 0.3
            state.position.y = THREE.MathUtils.lerp(-0.1, 0, bounceProgress)
          }
          if (state.animationProgress >= 1) {
            state.animationState = ANIMATION_STATES.IDLE
            state.position.y = 0
            state.rotation.x = state.isReversing ? 0 : Math.PI
          }
          break

        case ANIMATION_STATES.IDLE:
          // Hover animation (unchanged)
          if (state.hovered && state.hoverProgress < 1) {
            state.hoverProgress = Math.min(state.hoverProgress + delta / hoverAnimationDuration, 1)
          } else if (!state.hovered && state.hoverProgress > 0) {
            state.hoverProgress = Math.max(state.hoverProgress - delta / hoverAnimationDuration, 0)
          }

          const hoverOffset = THREE.MathUtils.lerp(0, hoverHeight, state.hoverProgress)
          const sineOffset = Math.sin(three.clock.elapsedTime * 2) * 0.05
          const targetY = hoverOffset + sineOffset

          state.position.y = THREE.MathUtils.lerp(state.position.y, targetY, 1 - Math.pow(0.001, delta))
          break
      }

      tempObject.position.copy(state.position)
      tempObject.rotation.copy(state.rotation)
      tempObject.updateMatrix()
      roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
      frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
      backMeshRef.current.setMatrixAt(index, tempObject.matrix)
    })

    roundedBoxRef.current.instanceMatrix.needsUpdate = true
    frontMeshRef.current.instanceMatrix.needsUpdate = true
    backMeshRef.current.instanceMatrix.needsUpdate = true
  })

  //   useCursor(hovered)

  return (
    <group
    //   ref={groupRef}
    //   position={[tile.x * 1.1, 10, tile.y * 1.1]}
    //   onClick={() => {
    //     onClick?.(tile)
    //     if (animationState !== ANIMATION_STATES.IDLE) return
    //     setShowPlusOne(!flipped)
    //   }}
    //   onPointerOver={() => setHovered(true)}
    //   onPointerOut={() => setHovered(false)}
    >
      <instancedMesh ref={roundedBoxRef} geometry={geom} material={robotColorMaterial} />
      <instancedMesh
        ref={frontMeshRef}
        position={[0, TILE_SIZE * 0.05 + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={planeGeom}
        material={topMaterial}
      />
      <instancedMesh
        ref={backMeshRef}
        position={[0, -TILE_SIZE * 0.05 - 0.001, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={planeGeom}
        material={bottomMaterial}
      />
      {/* {showPlusOne && <PlusOneAnimation position={[0, size * 0.05 + 0.2, 0]} />} */}
    </group>
  )
}
