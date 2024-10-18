import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Powerup, Tile as TileModel } from 'src/models'
import { CHUNK_SIZE, TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'
import { RoundedBoxGeometry } from 'three-stdlib'
import TileAnimationText from './TileAnimationText'
import { useCursor, useIntersect } from '@react-three/drei'

const getPowerupAnimation = (powerup: Powerup, powerupValue: number) => {
  switch (powerup) {
    case Powerup.Lock:
      return { text: 'Lock', color: '#FFD700', animationStyle: 'pulse' as const, size: 0.4 }
    case Powerup.Multiplier:
      return { text: `${powerupValue}x`, color: '#FF4500', animationStyle: 'shake' as const }
    default:
      return { text: '+1', color: '#F38332' }
  }
}

const ANIMATION_STATES = {
  IDLE: 0,
  JUMPING: 1,
  FLIPPING: 2,
  FALLING: 3,
}

const TILE_SIZE = 1
const geom = new RoundedBoxGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.1, TILE_SIZE * 0.95, undefined, 4)
const planeGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95)

const TileInstances = ({
  position,
  tiles,
  topMaterial,
  bottomMaterial,
  onClick,
}: {
  position: [number, number, number]
  tiles: TileModel[]
  topMaterial: THREE.MeshBasicMaterial
  bottomMaterial: THREE.MeshBasicMaterial
  onClick?: (tile: TileModel) => boolean
}) => {
  const tileGroupRef = useRef<THREE.Group>(null)
  const mainInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const topInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const bottomInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const boundingBox = useMemo(() => {
    const bb = new THREE.Box3()
    bb.min.set(position[0] - 1, position[1], position[2] - 1)
    bb.max.set(
      position[0] + CHUNK_SIZE * TILE_SIZE * 1.1,
      position[1] + TILE_SIZE * 0.1,
      position[2] + CHUNK_SIZE * TILE_SIZE * 1.1,
    )
    return bb
  }, [position])

  const { clock } = useThree()

  const tileStates = useRef(
    tiles.map((tile) => ({
      position: new THREE.Vector3(tile.x * 1.1, 0, tile.y * 1.1),
      rotation: tile.address !== '0x0' ? new THREE.Euler(Math.PI, 0, 0) : new THREE.Euler(0, 0, 0),
      flipped: tile.address !== '0x0',
      powerup: tile.powerup,
      powerupValue: tile.powerupValue,
      animationState: ANIMATION_STATES.IDLE,
      animationProgress: 0,
      hoverProgress: 0,
      color: tile.address !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR,
    })),
  )

  const [hovered, setHovered] = useState<number | undefined>()
  const [pointerDown, setPointerDown] = useState<number | undefined>()

  const [plusOneAnimations, setPlusOneAnimations] = useState<{ [key: number]: boolean }>({})

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (mainInstancedMeshRef.current) {
      // Force update all instance matrices
      tileStates.current.forEach((state, index) => {
        dummy.position.copy(state.position)
        dummy.rotation.copy(state.rotation)
        dummy.updateMatrix()
        mainInstancedMeshRef.current.setMatrixAt(index, dummy.matrix)
      })
      mainInstancedMeshRef.current.instanceMatrix.needsUpdate = true
    }
  }, []) // Empty dependency array for initial mount only

  useEffect(() => {
    tileStates.current.forEach((tileState, index) => {
      if (
        tileState.flipped !== (tiles[index].address !== '0x0') &&
        tileState.animationState === ANIMATION_STATES.IDLE
      ) {
        tileState.flipped = tiles[index].address !== '0x0'
        tileState.animationState = ANIMATION_STATES.JUMPING
        tileState.animationProgress = 0
      }
    })
  }, [tiles])

  useFrame((state, delta) => {
    const frustum = new THREE.Frustum()
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse),
    )

    tileGroupRef.current!.visible = frustum.intersectsBox(boundingBox)

    const jumpHeight = 0.5
    const hoverHeight = 0.1
    const animationDuration = 0.5
    const hoverAnimationDuration = 0.3

    tileStates.current.forEach((tileState, index) => {
      switch (tileState.animationState) {
        case ANIMATION_STATES.JUMPING:
          tileState.animationProgress = Math.min(tileState.animationProgress + delta / animationDuration, 1)
          if (tileState.animationProgress < 0.2) {
            // Initial drop
            tileState.position.y = THREE.MathUtils.lerp(0, -hoverHeight * 2, tileState.animationProgress / 0.2)
          } else {
            // Bounce up
            const bounceProgress = (tileState.animationProgress - 0.2) / 0.8
            tileState.position.y = THREE.MathUtils.lerp(
              -hoverHeight * 2,
              jumpHeight,
              Math.sin(bounceProgress * Math.PI),
            )
          }
          if (tileState.animationProgress >= 0.5) {
            tileState.animationState = ANIMATION_STATES.FLIPPING
            tileState.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FLIPPING:
          tileState.animationProgress = Math.min(tileState.animationProgress + delta / animationDuration, 1)

          const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
          const easedProgress = easeOutCubic(tileState.animationProgress)
          tileState.rotation.x = tileState.flipped
            ? THREE.MathUtils.lerp(0, Math.PI, easedProgress)
            : THREE.MathUtils.lerp(Math.PI, 0, easedProgress)
          // since the direction of the rotation is reversed when flipping back, we need to update the color at a different time
          // to make sure the color change is not visible
          if (easedProgress >= (!tileState.flipped ? 0.1 : 0.9))
            tileState.color = tileState.flipped ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR

          if (tileState.animationProgress >= 1) {
            tileState.animationState = ANIMATION_STATES.FALLING
            tileState.animationProgress = 0
          }

          break

        case ANIMATION_STATES.FALLING:
          tileState.animationProgress = Math.min(tileState.animationProgress + delta / animationDuration, 1)
          if (tileState.animationProgress < 0.7) {
            tileState.position.y = THREE.MathUtils.lerp(jumpHeight, -hoverHeight, tileState.animationProgress / 0.7)
          } else {
            const bounceProgress = (tileState.animationProgress - 0.7) / 0.3
            tileState.position.y = THREE.MathUtils.lerp(-hoverHeight, 0, bounceProgress)
          }
          if (tileState.animationProgress >= 1) {
            tileState.animationState = ANIMATION_STATES.IDLE
            tileState.position.y = 0
          }
          break

        case ANIMATION_STATES.IDLE:
          // Hover animation (unchanged)
          if (hovered === index && tileState.hoverProgress < 1) {
            tileState.hoverProgress = Math.min(tileState.hoverProgress + delta / hoverAnimationDuration, 1)
          } else if (hovered !== index && tileState.hoverProgress > 0) {
            tileState.hoverProgress = Math.max(tileState.hoverProgress - delta / hoverAnimationDuration, 0)
          }

          const hoverOffset = THREE.MathUtils.lerp(0, hoverHeight, tileState.hoverProgress)
          const sineOffset = Math.sin(clock.elapsedTime * 2) * 0.05
          const targetY = hoverOffset + sineOffset
          tileState.position.y = THREE.MathUtils.lerp(tileState.position.y, targetY, 1 - Math.pow(0.001, delta))
          break
      }

      // Update main tile
      dummy.position.copy(tileState.position)
      dummy.rotation.copy(tileState.rotation)
      dummy.updateMatrix()
      mainInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      const color = new THREE.Color(tileState.color)
      mainInstancedMeshRef.current!.setColorAt(index, color)

      // Calculate the offset based on the rotation
      const offset = TILE_SIZE * 0.06
      const yOffset = Math.cos(tileState.rotation.x) * offset
      const zOffset = Math.sin(tileState.rotation.x) * offset

      // Update top face
      dummy.position.set(tileState.position.x, tileState.position.y + yOffset, tileState.position.z + zOffset)
      dummy.rotation.set(0, 0, 0)
      dummy.rotateX(-Math.PI / 2)
      dummy.rotateX(tileState.rotation.x)
      dummy.updateMatrix()
      topInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      // Update bottom face
      dummy.position.set(tileState.position.x, tileState.position.y - yOffset, tileState.position.z - zOffset)
      dummy.rotation.set(0, 0, 0)
      dummy.rotateX(Math.PI / 2)
      dummy.rotateX(tileState.rotation.x)
      dummy.updateMatrix()
      bottomInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)
    })

    mainInstancedMeshRef.current.instanceColor.needsUpdate = true
    mainInstancedMeshRef.current.instanceMatrix.needsUpdate = true
    topInstancedMeshRef.current.instanceMatrix.needsUpdate = true
    bottomInstancedMeshRef.current.instanceMatrix.needsUpdate = true
  })

  const handleClick = async (event: THREE.Intersection<any>) => {
    if (onClick && event.instanceId !== undefined && pointerDown === event.instanceId) {
      const clickedTile = tiles[event.instanceId]
      if (clickedTile.address !== '0x0') return

      if (!onClick(clickedTile)) return

      setPlusOneAnimations((prev) => ({ ...prev, [event.instanceId]: true }))
      setTimeout(() => setPlusOneAnimations((prev) => ({ ...prev, [event.instanceId]: false })), 700)
    }
  }

  useCursor(hovered !== undefined, tileStates.current?.[hovered]?.flipped ? 'not-allowed' : 'pointer', 'grab')

  return (
    <group
      ref={tileGroupRef}
      position={position}
      onPointerDown={(event) => setPointerDown(event.instanceId)}
      onClick={handleClick}
      onPointerOver={(event) => setHovered(event.instanceId)}
      onPointerOut={() => setHovered(undefined)}
      onPointerMissed={() => setHovered(undefined)}
    >
      <instancedMesh frustumCulled={false} ref={mainInstancedMeshRef} args={[geom, undefined, tiles.length]} />
      <instancedMesh frustumCulled={false} ref={topInstancedMeshRef} args={[planeGeom, topMaterial, tiles.length]} />
      <instancedMesh
        frustumCulled={false}
        ref={bottomInstancedMeshRef}
        args={[planeGeom, bottomMaterial, tiles.length]}
      />
      {Object.entries(plusOneAnimations).map(([index, shouldShow]) => (
        <TileAnimationText
          key={index}
          visible={shouldShow}
          position={[
            tileStates.current[Number(index)].position.x,
            tileStates.current[Number(index)].position.y + TILE_SIZE * 0.05 + 0.2,
            tileStates.current[Number(index)].position.z,
          ]}
          {...getPowerupAnimation(tiles[Number(index)].powerup, tiles[Number(index)].powerupValue)}
        />
      ))}
    </group>
  )
}

export default TileInstances
