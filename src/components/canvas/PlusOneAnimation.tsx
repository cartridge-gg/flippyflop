import { useFrame } from '@react-three/fiber'
import { useState, useRef, useEffect, Suspense } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const PlusOneAnimation = ({ position, visible }) => {
  const [opacity, setOpacity] = useState(1)
  const textRef = useRef<any>()

  useEffect(() => {
    setOpacity(1)
  }, [position])

  useFrame((state, delta) => {
    if (textRef.current) {
      textRef.current.position.y += delta * 0.5 // Move upwards
      setOpacity((prev) => prev - delta * 0.5) // Fade out
    }
  })

  return (
    <Text
      visible={visible}
      ref={textRef}
      position={[position[0], position[1] + 0.5, position[2]]}
      fontSize={0.5}
      color='#F38332'
      anchorX='center'
      anchorY='middle'
      // use cartoonish font
      font='/fonts/SaladDaysRegular.woff'
      fontWeight={400}
      fillOpacity={opacity}
    >
      +1
    </Text>
  )
}

export default PlusOneAnimation
