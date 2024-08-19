import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Tile as TileModel } from 'src/models'
import { TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'
import { RoundedBoxGeometry } from 'three-stdlib'
import dynamic from 'next/dynamic'

const PlusOneAnimation = dynamic(() => import('@/components/canvas/PlusOneAnimation').then((mod) => mod.default), {
  ssr: false,
})

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
      color: TILE_ROBOT_SIDE_COLOR,
    })),
  )

  const [plusOneAnimations, setPlusOneAnimations] = useState<{ [key: number]: boolean }>({})

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
        color: TILE_ROBOT_SIDE_COLOR,
      })),
    )
  }, []) // Empty dependency array means this only runs on mount

  useEffect(() => {
    setTileStates((tileStates) =>
      tileStates.map((tileState, index) =>
        tileState.flipped !== (tiles[index].flipped !== '0x0')
          ? {
              ...tileState,
              flipped: tiles[index].flipped !== '0x0',
              animationState: ANIMATION_STATES.JUMPING,
              animationProgress: 0,
            }
          : tileState,
      ),
    )
  }, [tiles])

  useFrame((state, delta) => {
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
          newState.rotation.x = newState.flipped
            ? THREE.MathUtils.lerp(0, Math.PI, newState.animationProgress)
            : THREE.MathUtils.lerp(Math.PI, 0, newState.animationProgress)
          // since the direction of the rotation is reversed when flipping back, we need to update the color at a different time
          // to make sure the color change is not visible
          if (newState.animationProgress >= (!newState.flipped ? 0.1 : 0.9))
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
            newState.hoverProgress = Math.min(newState.hoverProgress + delta / hoverAnimationDuration, 1)
          } else if (!newState.hovered && newState.hoverProgress > 0) {
            newState.hoverProgress = Math.max(newState.hoverProgress - delta / hoverAnimationDuration, 0)
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

      const color = new THREE.Color(newState.color)
      mainInstancedMeshRef.current!.setColorAt(index, color)

      // Calculate the offset based on the rotation
      const offset = TILE_SIZE * 0.06
      const yOffset = Math.cos(newState.rotation.x) * offset
      const zOffset = Math.sin(newState.rotation.x) * offset

      // Update top face
      dummy.position.set(newState.position.x, newState.position.y + yOffset, newState.position.z + zOffset)
      dummy.rotation.set(0, 0, 0)
      dummy.rotateX(-Math.PI / 2)
      dummy.rotateX(newState.rotation.x)
      dummy.updateMatrix()
      topInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      // Update bottom face
      dummy.position.set(newState.position.x, newState.position.y - yOffset, newState.position.z - zOffset)
      dummy.rotation.set(0, 0, 0)
      dummy.rotateX(Math.PI / 2)
      dummy.rotateX(newState.rotation.x)
      dummy.updateMatrix()
      bottomInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      return newState
    })

    setTileStates(updatedTileStates)

    mainInstancedMeshRef.current.instanceColor.needsUpdate = true
    mainInstancedMeshRef.current.instanceMatrix.needsUpdate = true
    topInstancedMeshRef.current.instanceMatrix.needsUpdate = true
    bottomInstancedMeshRef.current.instanceMatrix.needsUpdate = true
  })

  const handleClick = (event: THREE.Intersection<any>) => {
    if (onClick && event.instanceId !== undefined) {
      const clickedTile = tiles[event.instanceId]
      if (clickedTile.flipped !== '0x0') return

      onClick(clickedTile)
      setPlusOneAnimations((prev) => ({ ...prev, [event.instanceId]: true }))
      setTimeout(() => setPlusOneAnimations((prev) => ({ ...prev, [event.instanceId]: false })), 500)
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
      {Object.entries(plusOneAnimations).map(
        ([index, shouldShow]) =>
          shouldShow && (
            <PlusOneAnimation
              key={index}
              position={[
                tileStates[Number(index)].position.x,
                tileStates[Number(index)].position.y + TILE_SIZE * 0.05 + 0.2,
                tileStates[Number(index)].position.z,
              ]}
            />
          ),
      )}
    </group>
  )
}

export default TileInstances