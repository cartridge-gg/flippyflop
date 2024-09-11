import { useFrame } from '@react-three/fiber'
import { useState, useRef, useEffect, Suspense } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

type AnimationStyle = 'shake' | 'pulse'

const TileAnimationText = ({
  text,
  color = '#F38332',
  position,
  size = 0.5,
  visible,
  animationStyle,
}: {
  text: string
  color: string
  position: [number, number, number]
  size?: number
  visible: boolean
  animationStyle?: AnimationStyle
}) => {
  const [opacity, setOpacity] = useState(1)
  const textRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    setOpacity(1)
  }, [visible])

  useFrame((state, delta) => {
    if (textRef.current) {
      textRef.current.position.y += delta * 0.1
      setOpacity((prev) => Math.max(prev - Math.exp(-delta * 550), 0))
      switch (animationStyle) {
        case 'shake':
          textRef.current.position.x += Math.sin(state.clock.elapsedTime * 30) * 0.02
          textRef.current.position.y += Math.cos(state.clock.elapsedTime * 30) * 0.02
          break
        case 'pulse':
          const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1
          textRef.current.scale.set(scale, scale, scale)
          break
      }
    }
  })

  return (
    <Suspense fallback={null}>
      <Text
        visible={visible}
        ref={textRef}
        position={[position[0], position[1] + 0.5, position[2]]}
        fontSize={size}
        color={color}
        anchorX='center'
        anchorY='middle'
        font='/fonts/SaladDaysRegular.woff'
        fontWeight={400}
        fillOpacity={opacity}
      >
        {text}
      </Text>
    </Suspense>
  )
}

export default TileAnimationText
