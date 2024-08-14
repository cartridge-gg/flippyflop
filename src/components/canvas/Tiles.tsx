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
const geom = new RoundedBoxGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.1, TILE_SIZE * 0.95, 0.03, 4)
const planeGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95)
const smileyColorMaterial = new THREE.MeshStandardMaterial({ color: TILE_SMILEY_SIDE_COLOR })
const robotColorMaterial = new THREE.MeshStandardMaterial({ color: TILE_ROBOT_SIDE_COLOR })

const tempObject = new THREE.Object3D()

export default function Tiles({
  tiles,
  frontTexture,
  backTexture,
  onClick,
}: {
  tiles: TileModel[]
  frontTexture: THREE.MeshBasicMaterial
  backTexture: THREE.MeshBasicMaterial
  onClick?: (tile: TileModel) => void
}) {
  const roundedBoxRef = useRef<THREE.InstancedMesh>(null)
  const frontMeshRef = useRef<THREE.InstancedMesh>(null)
  const backMeshRef = useRef<THREE.InstancedMesh>(null)

  const [tilesState, setTilesState] = useState(() =>
    tiles.map((tile) => {
      return {
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
    if (!roundedBoxRef.current || !frontMeshRef.current || !backMeshRef.current) return

    const instanceColor = new Float32Array(tiles.length * 3)

    tilesState.forEach((state, i) => {
      tempObject.position.set(tiles[i].x * 1.1, 0, tiles[i].y * 1.1)
      tempObject.updateMatrix()
      roundedBoxRef.current.setMatrixAt(i, tempObject.matrix)
      frontMeshRef.current.setMatrixAt(i, tempObject.matrix)
      backMeshRef.current.setMatrixAt(i, tempObject.matrix)

      const color = new THREE.Color(state.tileColor)
      instanceColor[i * 3] = color.r
      instanceColor[i * 3 + 1] = color.g
      instanceColor[i * 3 + 2] = color.b
    })

    roundedBoxRef.current.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColor, 3))
    roundedBoxRef.current.instanceMatrix.needsUpdate = true
    frontMeshRef.current.instanceMatrix.needsUpdate = true
    backMeshRef.current.instanceMatrix.needsUpdate = true
  }, [tilesState, tiles])

  useEffect(() => {
    tilesState.forEach((state, index) => {
      tempObject.position.set(tiles[index].x * 1.1, 0, tiles[index].y * 1.1)
      tempObject.rotation.x = state.flipped ? Math.PI : 0
      tempObject.updateMatrix()
      roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
      frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
      backMeshRef.current.setMatrixAt(index, tempObject.matrix)
      roundedBoxRef.current.instanceMatrix.needsUpdate = true
      frontMeshRef.current.instanceMatrix.needsUpdate = true
      backMeshRef.current.instanceMatrix.needsUpdate = true
    })
  }, [])

  useFrame((three, delta) => {
    if (!roundedBoxRef.current || !frontMeshRef.current || !backMeshRef.current) return

    tilesState.forEach((state, index) => {
      switch (state.animationState) {
        case ANIMATION_STATES.JUMPING:
          state.animationProgress += delta / animationDuration
          tempObject.position.y = jumpHeight * Math.sin(state.animationProgress * Math.PI)
          tempObject.updateMatrix()
          roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
          frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
          backMeshRef.current.setMatrixAt(index, tempObject.matrix)
          roundedBoxRef.current.instanceMatrix.needsUpdate = true
          frontMeshRef.current.instanceMatrix.needsUpdate = true
          backMeshRef.current.instanceMatrix.needsUpdate = true
          if (state.animationProgress >= 0.5) {
            state.animationState = ANIMATION_STATES.FLIPPING
            state.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FLIPPING:
          state.showPlusOne = false
          state.animationProgress += delta / animationDuration
          tempObject.rotation.x = state.isReversing
            ? THREE.MathUtils.lerp(Math.PI, 0, state.animationProgress)
            : THREE.MathUtils.lerp(0, Math.PI, state.animationProgress)
          if (state.animationProgress >= 0.8) {
            state.tileColor = state.targetColor
            roundedBoxRef.current.setColorAt(index, new THREE.Color(state.tileColor))
            frontMeshRef.current.setColorAt(index, new THREE.Color(state.tileColor))
            backMeshRef.current.setColorAt(index, new THREE.Color(state.tileColor))
            roundedBoxRef.current.instanceColor.needsUpdate = true
            frontMeshRef.current.instanceColor.needsUpdate = true
            backMeshRef.current.instanceColor.needsUpdate = true
          }
          if (state.animationProgress >= 1) {
            state.animationState = ANIMATION_STATES.FALLING
            state.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FALLING:
          state.animationProgress += delta / animationDuration
          if (state.animationProgress < 0.7) {
            tempObject.position.y = THREE.MathUtils.lerp(jumpHeight, -0.1, state.animationProgress / 0.7)
            tempObject.updateMatrix()
            roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
            frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
            backMeshRef.current.setMatrixAt(index, tempObject.matrix)
            roundedBoxRef.current.instanceMatrix.needsUpdate = true
            frontMeshRef.current.instanceMatrix.needsUpdate = true
            backMeshRef.current.instanceMatrix.needsUpdate = true
          } else {
            const bounceProgress = (state.animationProgress - 0.7) / 0.3
            tempObject.position.y = THREE.MathUtils.lerp(-0.1, 0, bounceProgress)
            tempObject.updateMatrix()
            roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
            frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
            backMeshRef.current.setMatrixAt(index, tempObject.matrix)
            roundedBoxRef.current.instanceMatrix.needsUpdate = true
            frontMeshRef.current.instanceMatrix.needsUpdate = true
            backMeshRef.current.instanceMatrix.needsUpdate = true
          }
          if (state.animationProgress >= 1) {
            state.animationState = ANIMATION_STATES.IDLE
            tempObject.position.y = 0
            tempObject.rotation.x = state.isReversing ? 0 : Math.PI
            tempObject.updateMatrix()
            roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
            frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
            backMeshRef.current.setMatrixAt(index, tempObject.matrix)
            roundedBoxRef.current.instanceMatrix.needsUpdate = true
            frontMeshRef.current.instanceMatrix.needsUpdate = true
            backMeshRef.current.instanceMatrix.needsUpdate = true
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

          tempObject.position.y = THREE.MathUtils.lerp(tempObject.position.y, targetY, 1 - Math.pow(0.001, delta))
          tempObject.updateMatrix()
          roundedBoxRef.current.setMatrixAt(index, tempObject.matrix)
          frontMeshRef.current.setMatrixAt(index, tempObject.matrix)
          backMeshRef.current.setMatrixAt(index, tempObject.matrix)
          roundedBoxRef.current.instanceMatrix.needsUpdate = true
          frontMeshRef.current.instanceMatrix.needsUpdate = true
          backMeshRef.current.instanceMatrix.needsUpdate = true
          break
      }
    })
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
        material={frontTexture}
      />
      <instancedMesh
        ref={backMeshRef}
        position={[0, -TILE_SIZE * 0.05 - 0.001, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={planeGeom}
        material={backTexture}
      />
      {/* {showPlusOne && <PlusOneAnimation position={[0, size * 0.05 + 0.2, 0]} />} */}
    </group>
  )
}
