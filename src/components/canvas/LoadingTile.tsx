import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import { TILE_ROBOT_SIDE_COLOR, TILE_SMILEY_SIDE_COLOR } from '@/constants'
import { Text } from '@react-three/drei'

const TILE_SIZE = 1
const geom = new RoundedBoxGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.1, TILE_SIZE * 0.95, undefined, 4)
const planeGeom = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95)

const LoadingTile = () => {
  const groupRef: any = useRef()
  const mainMeshRef: any = useRef()

  const { camera } = useThree()

  const topTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load('/textures/Robot_Black_2x_Rounded.png')
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  const bottomTexture = useMemo(() => {
    const texture = new THREE.TextureLoader().load('/textures/Smiley_Orange_2x_Rounded.png')
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  const topMaterial = useMemo(() => new THREE.MeshBasicMaterial({ map: topTexture, transparent: true }), [topTexture])
  const bottomMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ map: bottomTexture, transparent: true }),
    [bottomTexture],
  )

  const [flipped, setFlipped] = React.useState(false)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    // Complex rotation
    const xRotation = Math.sin(time * 2) * Math.PI
    const yRotation = Math.cos(time * 1.5) * Math.PI * 0.25

    // Floating motion
    const floatY = Math.sin(time * 3) * 0.1

    // Pulsating scale
    const scale = 2.5 + Math.sin(time * 5) * 0.05

    setFlipped(xRotation < 0)

    if (groupRef.current && mainMeshRef.current) {
      groupRef.current.rotation.x = xRotation
      groupRef.current.rotation.y = yRotation
      groupRef.current.position.y = floatY
      groupRef.current.scale.set(scale, scale, scale)
    }

    // Update position to stay in front of the camera
    if (groupRef.current) {
      groupRef.current.position.copy(camera.position)
      groupRef.current.position.z -= 2 // Adjust this value to change the distance from the camera
      groupRef.current.position.y -= 1.5 // Adjust this value to change the height from the ground
      groupRef.current.position.x -= 2
      // groupRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={groupRef}>
      <group>
        <mesh ref={mainMeshRef} geometry={geom}>
          <meshBasicMaterial color={flipped ? TILE_SMILEY_SIDE_COLOR : TILE_ROBOT_SIDE_COLOR} />
        </mesh>
        <mesh geometry={planeGeom} material={topMaterial} position-y={TILE_SIZE * 0.06} rotation-x={-Math.PI / 2} />
        <mesh geometry={planeGeom} material={bottomMaterial} position-y={-TILE_SIZE * 0.06} rotation-x={Math.PI / 2} />
      </group>
    </group>
  )
}

export default LoadingTile
