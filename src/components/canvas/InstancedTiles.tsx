import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Tile as TileModel } from 'src/models'
import { TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'

const ANIMATION_STATES = {
  IDLE: 0,
  JUMPING: 1,
  FLIPPING: 2,
  FALLING: 3,
}

const vertexShader = `
  attribute vec3 instanceColor;
  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vColor = instanceColor;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D frontTexture;
  uniform sampler2D backTexture;
  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vNormal;

  void main() {
    vec3 normalAbs = abs(vNormal);
    
    if (normalAbs.y > 0.5) {
      // Top or bottom face
      vec4 texColor;
      if (vNormal.y > 0.0) {
        // Top face (front texture)
        texColor = texture2D(frontTexture, vUv);
      } else {
        // Bottom face (back texture)
        texColor = texture2D(backTexture, vUv);
      }
      gl_FragColor = texColor;
    } else {
      // Side faces
      gl_FragColor = vec4(vColor, 1.0);
    }
  }
`

const TileInstances = ({
  tiles,
  frontTexture,
  backTexture,
  size = 1,
  onClick,
}: {
  tiles: TileModel[]
  frontTexture: THREE.Texture
  backTexture: THREE.Texture
  size?: number
  onClick?: (tile: TileModel) => void
}) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)
  const { clock } = useThree()

  const [tileStates, setTileStates] = useState(() =>
    tiles.map((tile) => ({
      position: new THREE.Vector3(tile.x * 1.1, 0, tile.y * 1.1),
      rotation: new THREE.Euler(),
      flipped: tile.flipped !== '0x0',
      animationState: ANIMATION_STATES.IDLE,
      animationProgress: 0,
      hoverProgress: 0,
      color: tile.flipped !== '0x0' ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR,
      isReversing: false,
    })),
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const customMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        frontTexture: { value: frontTexture },
        backTexture: { value: backTexture },
      },
    })
  }, [frontTexture, backTexture])

  useEffect(() => {
    setTileStates((prevStates) =>
      prevStates.map((state, index) => {
        const newFlippedState = tiles[index].flipped !== '0x0'
        if (newFlippedState !== state.flipped) {
          return {
            ...state,
            flipped: newFlippedState,
            color: newFlippedState ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR,
            animationState: ANIMATION_STATES.JUMPING,
            animationProgress: 0,
            isReversing: !newFlippedState,
          }
        }
        return state
      }),
    )
  }, [tiles])

  useEffect(() => {
    if (instancedMeshRef.current) {
      const mesh = instancedMeshRef.current
      const instanceColor = new Float32Array(tiles.length * 3)

      tileStates.forEach((state, i) => {
        dummy.position.copy(state.position)
        dummy.rotation.copy(state.rotation)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)

        const color = new THREE.Color(state.color)
        instanceColor[i * 3] = color.r
        instanceColor[i * 3 + 1] = color.g
        instanceColor[i * 3 + 2] = color.b
      })

      mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColor, 3))
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [tileStates, tiles])

  useFrame((state, delta) => {
    if (!instancedMeshRef.current) return

    const jumpHeight = 0.5
    const hoverHeight = 0.1
    const animationDuration = 0.5
    const hoverAnimationDuration = 0.3

    tileStates.forEach((tileState, index) => {
      switch (tileState.animationState) {
        case ANIMATION_STATES.JUMPING:
          tileState.animationProgress += delta / animationDuration
          tileState.position.y = jumpHeight * Math.sin(tileState.animationProgress * Math.PI)
          if (tileState.animationProgress >= 0.5) {
            tileState.animationState = ANIMATION_STATES.FLIPPING
            tileState.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FLIPPING:
          tileState.animationProgress += delta / animationDuration
          tileState.rotation.x = tileState.flipped
            ? THREE.MathUtils.lerp(0, Math.PI, tileState.animationProgress)
            : THREE.MathUtils.lerp(Math.PI, 0, tileState.animationProgress)
          if (tileState.animationProgress >= 1) {
            tileState.flipped = !tileState.flipped
            tileState.color = tileState.flipped ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR
            tileState.animationState = ANIMATION_STATES.FALLING
            tileState.animationProgress = 0
          }
          break

        case ANIMATION_STATES.FALLING:
          tileState.animationProgress += delta / animationDuration
          if (tileState.animationProgress < 0.7) {
            tileState.position.y = THREE.MathUtils.lerp(jumpHeight, -0.1, tileState.animationProgress / 0.7)
          } else {
            const bounceProgress = (tileState.animationProgress - 0.7) / 0.3
            tileState.position.y = THREE.MathUtils.lerp(-0.1, 0, bounceProgress)
          }
          if (tileState.animationProgress >= 1) {
            tileState.animationState = ANIMATION_STATES.IDLE
            tileState.position.y = 0
          }
          break

        case ANIMATION_STATES.IDLE:
          const hoverOffset = THREE.MathUtils.lerp(0, hoverHeight, tileState.hoverProgress)
          const sineOffset = Math.sin(clock.elapsedTime * 2) * 0.05
          const targetY = hoverOffset + sineOffset
          tileState.position.y = THREE.MathUtils.lerp(tileState.position.y, targetY, 1 - Math.pow(0.001, delta))
          break
      }

      dummy.position.copy(tileState.position)
      dummy.rotation.copy(tileState.rotation)
      dummy.updateMatrix()
      instancedMeshRef.current!.setMatrixAt(index, dummy.matrix)

      // Update instance color
      const color = new THREE.Color(tileState.color)
      instancedMeshRef.current!.geometry.attributes.instanceColor.setXYZ(index, color.r, color.g, color.b)
    })

    instancedMeshRef.current.instanceMatrix.needsUpdate = true
    instancedMeshRef.current.geometry.attributes.instanceColor.needsUpdate = true
  })

  const handleClick = (event: THREE.Intersection<any>) => {
    if (onClick && event.instanceId !== undefined) {
      const clickedTile = tiles[event.instanceId]
      onClick(clickedTile)
    }
  }

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, tiles.length]}
      onClick={handleClick}
      material={customMaterial}
    >
      <boxGeometry args={[size * 0.95, size * 0.1, size * 0.95]} />
    </instancedMesh>
  )
}

export default TileInstances
