import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Powerup, Tile as TileModel } from 'src/models'
import { RoundedBoxGeometry } from 'three-stdlib'
import TileAnimationText from './TileAnimationText'
import { Plane, useCursor } from '@react-three/drei'
import { CHUNK_SIZE, TEAMS, TILE_REGISTRY } from '@/constants'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useAccount } from '@starknet-react/core'
import { calculateLocalTilePos, maskAddress } from '@/utils'

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
  POWERUP: 4,
}

const ANIMATION_COOLDOWN = 1 // Time in seconds to consider animations as "close"

const TILE_SIZE = 1
const geom = new RoundedBoxGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.1, TILE_SIZE * 0.95, undefined, 4)

export interface TileState {
  position: THREE.Vector3
  rotation: THREE.Euler
  flipped: boolean
  powerup: Powerup
  powerupValue: number
  animationState: number
  animationProgress: number
  animationQueue: number[]
  lastFlipTime: number
  hoverProgress: number
  color: string
  team: number
  lastTeam: number
}

const TileInstances = ({
  position,
  tiles,
  material,
  robotMaterial,
  onClick,
}: {
  position: [number, number, number]
  tiles: TileModel[]
  material: CustomShaderMaterial
  robotMaterial: THREE.MeshBasicMaterial
  onClick?: (tile: TileModel) => boolean
}) => {
  const { address } = useAccount()
  const mainInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const topInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const bottomInstancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const planeGeom = useMemo(() => new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95), [])

  const { clock } = useThree()

  const tileStates = useRef<TileState[]>(
    tiles.map((tile) => ({
      position: new THREE.Vector3(tile.x * 1.1, 0, tile.y * 1.1),
      rotation: tile.address !== '0x0' ? new THREE.Euler(Math.PI, 0, 0) : new THREE.Euler(0, 0, 0),
      flipped: tile.address !== '0x0',
      powerup: tile.powerup,
      powerupValue: tile.powerupValue,
      animationState: ANIMATION_STATES.IDLE,
      animationProgress: 0,
      animationQueue: [] as number[],
      lastFlipTime: -Infinity,
      hoverProgress: 0,
      color: tile.address !== '0x0' ? TILE_REGISTRY[TEAMS[tile.team]].side : TILE_REGISTRY.robot.side,
      team: tile.team,
      lastTeam: tile.team,
    })),
  )

  const [hoveredTile, setHoveredTile] = useState<number | undefined>(undefined)
  const [pointerDownTile, setPointerDownTile] = useState<number | undefined>(undefined)
  const [plusOneAnimations, setPlusOneAnimations] = useState<{ [key: number]: number }>({})

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const currentTime = performance.now() / 1000 // Convert to seconds

    tileStates.current.forEach((tileState, index) => {
      const shouldBeFlipped = tiles[index].address !== '0x0'

      if (tileState.flipped !== shouldBeFlipped) {
        // Clear any existing animations
        tileState.animationQueue = []
        tileState.animationState = ANIMATION_STATES.IDLE
        tileState.animationProgress = 0

        // Add jumping animation
        tileState.animationQueue.push(ANIMATION_STATES.JUMPING)
        tileState.lastFlipTime = currentTime
      } else if (tileState.powerup !== tiles[index].powerup) {
        const timeSinceLastFlip = currentTime - tileState.lastFlipTime

        if (timeSinceLastFlip > ANIMATION_COOLDOWN) {
          if (!tileState.animationQueue.includes(ANIMATION_STATES.POWERUP)) {
            tileState.animationQueue.push(ANIMATION_STATES.POWERUP)
          }
        }

        if (tiles[index].address === maskAddress(address)) {
          setPlusOneAnimations((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }))
        }
      }

      tileState.flipped = shouldBeFlipped
      tileState.powerup = tiles[index].powerup
      tileState.powerupValue = tiles[index].powerupValue
      tileState.lastTeam = tileState.team
      tileState.team = tiles[index].team
    })

    if (bottomInstancedMeshRef.current) {
      const teamAttribute = new Float32Array(tiles.length)
      const powerupAttribute = new Float32Array(tiles.length)
      tileStates.current.forEach((tileState, i) => {
        teamAttribute[i] = tileState.flipped ? tileState.team : tileState.lastTeam
        powerupAttribute[i] = tileState.powerup
      })
      bottomInstancedMeshRef.current.geometry.setAttribute('team', new THREE.InstancedBufferAttribute(teamAttribute, 1))
      bottomInstancedMeshRef.current.geometry.setAttribute(
        'powerup',
        new THREE.InstancedBufferAttribute(powerupAttribute, 1),
      )
    }
  }, [tiles])

  useFrame((state, delta) => {
    if (material.uniforms) {
      material.uniforms.time.value = state.clock.elapsedTime
    }

    const jumpHeight = 0.5
    const hoverHeight = 0.1
    const powerupDepth = 0.3
    const animationDuration = 0.5
    const powerupAnimationDuration = 0.7
    const hoverAnimationDuration = 0.3

    tileStates.current.forEach((tileState, index) => {
      // Process animation queue
      if (tileState.animationState === ANIMATION_STATES.IDLE && tileState.animationQueue.length > 0) {
        tileState.animationState = tileState.animationQueue.shift()!
        tileState.animationProgress = 0
      }

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
            tileState.color = tileState.flipped ? TILE_REGISTRY[TEAMS[tileState.team]].side : TILE_REGISTRY.robot.side

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

        case ANIMATION_STATES.POWERUP:
          tileState.animationProgress = Math.min(tileState.animationProgress + delta / powerupAnimationDuration, 1)
          if (tileState.animationProgress < 0.3) {
            // Press in
            const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
            tileState.position.y = THREE.MathUtils.lerp(
              0,
              -powerupDepth,
              easeOutCubic(tileState.animationProgress / 0.3),
            )
          } else if (tileState.animationProgress < 0.7) {
            // Bounce up
            const bounceProgress = (tileState.animationProgress - 0.3) / 0.4
            const easeOutQuad = (t: number): number => 1 - Math.pow(1 - t, 2)
            tileState.position.y = THREE.MathUtils.lerp(-powerupDepth, powerupDepth * 0.8, easeOutQuad(bounceProgress))
          } else {
            // Settle back to normal with easing
            const settleProgress = (tileState.animationProgress - 0.7) / 0.3
            tileState.position.y = THREE.MathUtils.lerp(powerupDepth * 0.8, 0, settleProgress)
          }
          if (tileState.animationProgress >= 1) {
            tileState.animationState = ANIMATION_STATES.IDLE
            tileState.position.y = 0
          }
          break

        case ANIMATION_STATES.IDLE:
          // Hover animation
          if (hoveredTile === index && tileState.hoverProgress < 1) {
            tileState.hoverProgress = Math.min(tileState.hoverProgress + delta / hoverAnimationDuration, 1)
          } else if (hoveredTile !== index && tileState.hoverProgress > 0) {
            tileState.hoverProgress = Math.max(tileState.hoverProgress - delta / hoverAnimationDuration, 0)
          }

          const baseHoverHeight = tileState.powerup > 0 ? hoverHeight * 2 : hoverHeight // Powerup tiles float higher
          const hoverOffset = THREE.MathUtils.lerp(0, baseHoverHeight, tileState.hoverProgress)
          const sineAmplitude = tileState.powerup > 0 ? 0.08 : 0.05 // Larger floating animation for powerup tiles
          const sineOffset = Math.sin(clock.elapsedTime * 2) * sineAmplitude

          // Add a constant float height for powerup tiles
          const powerupFloat = tileState.powerup > 0 ? 0.05 : 0
          const targetY = hoverOffset + sineOffset + powerupFloat

          tileState.position.y = THREE.MathUtils.lerp(tileState.position.y, targetY, 1 - Math.pow(0.001, delta))
          break
      }

      // Update main tile
      dummy.position.copy(tileState.position)
      dummy.rotation.copy(tileState.rotation)
      dummy.updateMatrix()
      mainInstancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      const color = new THREE.Color(tileState.color)
      // Add brightness multiplier for powerup tiles
      if (tileState.powerup > 0) {
        const pulseEffect = 0.2 * Math.sin(state.clock.elapsedTime * 1.5) + 1.2
        switch (tileState.team) {
          case 0:
            color.multiplyScalar(1.2 * pulseEffect)
            break
          case 1:
            color.multiplyScalar(1.0 * pulseEffect)
            break
          case 2:
            color.multiplyScalar(1.8 * pulseEffect)
            break
          case 3:
            color.multiplyScalar(1.2 * pulseEffect)
            break
          case 4:
            color.multiplyScalar(1.4 * pulseEffect)
            break
          case 5:
            color.multiplyScalar(1.8 * pulseEffect)
            break
        }
      }
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
    const [localX, localY] = calculateLocalTilePos(position[0], position[2], event.point.x, event.point.z)
    const tileIndex = localX + localY * CHUNK_SIZE
    if (onClick && pointerDownTile === tileIndex) {
      const clickedTile = tiles[tileIndex]
      if (clickedTile.address !== '0x0') return

      if (!onClick(clickedTile)) return

      setPlusOneAnimations((prev) => ({ ...prev, [tileIndex]: (prev[tileIndex] || 0) + 1 }))
    }
  }

  // Update pointer style depending on the hovered tile
  useEffect(() => {
    if (pointerDownTile !== undefined) {
      document.body.style.cursor = 'grabbing'
    } else if (hoveredTile !== undefined) {
      document.body.style.cursor = tileStates.current[hoveredTile].flipped ? 'grab' : 'pointer'
    } else {
      document.body.style.cursor = 'grab'
    }
  }, [hoveredTile, pointerDownTile])

  return (
    <group position={position}>
      <Plane
        position={[CHUNK_SIZE * 1.1 * 0.5 + 0.4, 1, CHUNK_SIZE * 1.1 * 0.5 + 0.4]}
        args={[CHUNK_SIZE * 1.1, CHUNK_SIZE * 1.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        visible={false}
        onPointerMove={(event) => {
          const [x, y] = calculateLocalTilePos(position[0], position[2], event.point.x, event.point.z)
          if (x >= 0 && y >= 0 && x < CHUNK_SIZE && y < CHUNK_SIZE) {
            setHoveredTile(x + y * CHUNK_SIZE)
          } else {
            setHoveredTile(undefined)
          }
        }}
        onPointerOut={() => {
          setHoveredTile(undefined)
        }}
        onPointerDown={(event) => {
          const [x, y] = calculateLocalTilePos(position[0], position[2], event.point.x, event.point.z)
          if (x >= 0 && y >= 0 && x < CHUNK_SIZE && y < CHUNK_SIZE) {
            setPointerDownTile(x + y * CHUNK_SIZE)
          } else {
            setPointerDownTile(undefined)
          }
        }}
        onPointerUp={(event) => {
          setPointerDownTile(undefined)
        }}
      />
      <instancedMesh frustumCulled={false} ref={mainInstancedMeshRef} args={[geom, undefined, tiles.length]} />
      <instancedMesh frustumCulled={false} ref={topInstancedMeshRef} args={[planeGeom, robotMaterial, tiles.length]} />
      <instancedMesh frustumCulled={false} ref={bottomInstancedMeshRef} args={[planeGeom, material, tiles.length]} />
      {Object.entries(plusOneAnimations).map(([index, key]) => (
        <TileAnimationText
          key={index}
          visbilityKey={key}
          tileIndex={Number(index)}
          tileStates={tileStates}
          {...getPowerupAnimation(tiles[Number(index)].powerup, tiles[Number(index)].powerupValue)}
        />
      ))}
    </group>
  )
}

export default TileInstances
