import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Tile as TileModel } from 'src/models'
import { TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'
import { RoundedBoxGeometry } from 'three-stdlib'

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
  tiles,
  topMaterial,
  bottomMaterial,
  onClick,
}: {
  tiles: TileModel[]
  topMaterial: THREE.MeshBasicMaterial
  bottomMaterial: THREE.MeshBasicMaterial
  onClick?: (tile: TileModel) => void
}) => {
  const mainInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const topInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const bottomInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const { clock } = useThree()

  const [tileStates, setTileStates] = useState(() =>
    tiles.map((tile) => ({
      position: new THREE.Vector3(tile.x * 1.1, 0, tile.y * 1.1),
      rotation: new THREE.Euler(),
      flipped: tile.flipped !== '0x0',
      hovered: false,
      animationState: ANIMATION_STATES.IDLE,
      animationProgress: 0,
      hoverProgress: 0,
      color: tile.flipped !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR,
    })),
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    setTileStates(
      tiles.map((tile) => ({
        position: new THREE.Vector3(tile.x * 1.1, 0, tile.y * 1.1),
        rotation: new THREE.Euler(),
        flipped: tile.flipped !== '0x0',
        hovered: false,
        animationState: tile.flipped !== '0x0' ? ANIMATION_STATES.JUMPING : ANIMATION_STATES.IDLE,
        animationProgress: 0,
        hoverProgress: 0,
        color: tile.flipped !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR,
      })),
    )
  }, []) // Empty dependency array means this only runs on mount

  useEffect(() => {
    if (mainInstancedMeshRef.current && topInstancedMeshRef.current && bottomInstancedMeshRef.current) {
      const mainMesh = mainInstancedMeshRef.current
      const topMesh = topInstancedMeshRef.current
      const bottomMesh = bottomInstancedMeshRef.current

      tileStates.forEach((state, i) => {
        // Main tile
        dummy.position.copy(state.position)
        dummy.rotation.copy(state.rotation)
        dummy.updateMatrix()
        mainMesh.setMatrixAt(i, dummy.matrix)

        // Top face
        dummy.position.set(state.position.x, state.position.y + TILE_SIZE * 0.05 + 0.001, state.position.z)
        dummy.rotation.set(-Math.PI / 2, 0, 0)
        dummy.updateMatrix()
        topMesh.setMatrixAt(i, dummy.matrix)

        // Bottom face
        dummy.position.set(state.position.x, state.position.y - TILE_SIZE * 0.05 - 0.001, state.position.z)
        dummy.rotation.set(Math.PI / 2, 0, 0)
        dummy.updateMatrix()
        bottomMesh.setMatrixAt(i, dummy.matrix)

        const color = new THREE.Color(state.color)
        mainMesh.setColorAt(i, color)
      })

      mainMesh.instanceColor.needsUpdate = true
      mainMesh.instanceMatrix.needsUpdate = true
      topMesh.instanceMatrix.needsUpdate = true
      bottomMesh.instanceMatrix.needsUpdate = true
    }
  }, [tileStates, tiles])

  useFrame((state, delta) => {
    if (!mainInstancedMeshRef.current || !topInstancedMeshRef.current || !bottomInstancedMeshRef.current) return

    const jumpHeight = 0.5
    const hoverHeight = 0.1
    const animationDuration = 0.5
    const hoverAnimationDuration = 0.3

    const updatedTileStates = tileStates.map((tileState, index) => {
      const newState = { ...tileState }

      switch (tileState.animationState) {
        case ANIMATION_STATES.JUMPING:
          newState.animationProgress = Math.min(newState.animationProgress + delta / animationDuration, 1)
          newState.position.y = jumpHeight * Math.sin(newState.animationProgress * Math.PI)
          if (newState.animationProgress >= 0.5) {
            newState.animationState = ANIMATION_STATES.FLIPPING
            newState.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FLIPPING:
          newState.animationProgress = Math.min(newState.animationProgress + delta / animationDuration, 1)
          console.log(newState.animationProgress)
          newState.rotation.x = newState.flipped
            ? THREE.MathUtils.lerp(0, Math.PI, newState.animationProgress)
            : THREE.MathUtils.lerp(Math.PI, 0, newState.animationProgress)
          if (newState.animationProgress >= 0.8)
            newState.color = newState.flipped ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR
          if (newState.animationProgress >= 1) {
            newState.animationState = ANIMATION_STATES.FALLING
            newState.animationProgress = 0
          }

          break

        case ANIMATION_STATES.FALLING:
          newState.animationProgress = Math.min(newState.animationProgress + delta / animationDuration, 1)
          if (newState.animationProgress < 0.7) {
            newState.position.y = THREE.MathUtils.lerp(jumpHeight, -0.1, newState.animationProgress / 0.7)
          } else {
            const bounceProgress = (newState.animationProgress - 0.7) / 0.3
            newState.position.y = THREE.MathUtils.lerp(-0.1, 0, bounceProgress)
          }
          if (newState.animationProgress >= 1) {
            newState.animationState = ANIMATION_STATES.IDLE
            newState.position.y = 0
          }
          break

        case ANIMATION_STATES.IDLE:
          // Hover animation (unchanged)
          if (newState.hovered && newState.hoverProgress < 1) {
            newState.hoverProgress = Math.min(newState.hoverProgress + delta / animationDuration, 1)
          } else if (!newState.hovered && newState.hoverProgress > 0) {
            newState.hoverProgress = Math.max(newState.hoverProgress - delta / animationDuration, 0)
          }

          const hoverOffset = THREE.MathUtils.lerp(0, hoverHeight, newState.hoverProgress)
          const sineOffset = Math.sin(clock.elapsedTime * 2) * 0.05
          const targetY = hoverOffset + sineOffset
          newState.position.y = THREE.MathUtils.lerp(newState.position.y, targetY, 1 - Math.pow(0.001, delta))
          break
      }

      // Update main tile
      dummy.position.copy(newState.position)
      dummy.rotation.copy(newState.rotation)
      dummy.updateMatrix()
      mainInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      // Update top face
      dummy.position.set(newState.position.x, newState.position.y + TILE_SIZE * 0.05 + 0.001, newState.position.z)
      dummy.rotation.set(-Math.PI / 2 + newState.rotation.x, 0, 0)
      dummy.updateMatrix()
      topInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      // Update bottom face
      dummy.position.set(newState.position.x, newState.position.y + TILE_SIZE * 0.05 + 0.001, newState.position.z)
      dummy.rotation.set(Math.PI / 2 + newState.rotation.x, 0, 0)
      dummy.updateMatrix()
      bottomInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      return newState
    })

    setTileStates(updatedTileStates)

    mainInstancedMeshRef.current.instanceMatrix.needsUpdate = true
    topInstancedMeshRef.current.instanceMatrix.needsUpdate = true
    bottomInstancedMeshRef.current.instanceMatrix.needsUpdate = true
  })

  const handleClick = (event: THREE.Intersection<any>) => {
    if (onClick && event.instanceId !== undefined) {
      const clickedTile = tiles[event.instanceId]
      onClick(clickedTile)

      // Update the state of the clicked tile only
      setTileStates((prevStates) =>
        prevStates.map((state, index) => {
          if (index === event.instanceId) {
            return {
              ...state,
              flipped: !state.flipped,
              animationState: ANIMATION_STATES.JUMPING,
              animationProgress: 0,
            }
          }
          return state
        }),
      )
    }
  }

  const handleHover = (event: THREE.Intersection<any>) => {
    setTileStates((prevStates) =>
      prevStates.map((state, idx) => ({
        ...state,
        hovered: idx === event.instanceId ? true : false,
      })),
    )
  }

  return (
    <group>
      <instancedMesh
        ref={mainInstancedMeshRef}
        args={[geom, undefined, tiles.length]}
        onClick={handleClick}
        onPointerOver={(event) => handleHover(event)}
        onPointerOut={(event) => handleHover({ ...event, instanceId: undefined })}
      />
      <instancedMesh ref={topInstancedMeshRef} args={[planeGeom, topMaterial, tiles.length]} />
      <instancedMesh ref={bottomInstancedMeshRef} args={[planeGeom, bottomMaterial, tiles.length]} />
    </group>
  )
}

export default TileInstances
