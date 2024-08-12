import { useFrame } from '@react-three/fiber'
import { useState, useRef, useEffect } from 'react'
import { Text, Text3D } from '@react-three/drei'
import * as THREE from 'three'

const PlusOneAnimation = ({ position }) => {
  const [opacity, setOpacity] = useState(1)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    setOpacity(1)
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2])
    }
  }, [position])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y += delta * 0.5 // Move upwards
      setOpacity((prev) => Math.max(prev - delta * 0.5, 0)) // Fade out, but not below 0
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main text */}
      <Text
        fontSize={0.4}
        color='#F38332'
        anchorX='center'
        anchorY='middle'
        font='/fonts/SaladDaysRegular.woff'
        fontWeight={400}
        fillOpacity={opacity}
      >
        +1
      </Text>

      {/* Shadow */}
      <Text
        fontSize={0.4}
        color='#00000080'
        anchorX='center'
        anchorY='middle'
        font='/fonts/SaladDaysRegular.woff'
        fontWeight={400}
        fillOpacity={opacity * 0.3}
        position={[0.01, -0.02, -0.01]} // Offset for shadow effect
      >
        +1
      </Text>
    </group>
  )
}

export default PlusOneAnimation
