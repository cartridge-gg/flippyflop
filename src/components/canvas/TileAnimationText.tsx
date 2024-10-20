import { useFrame } from '@react-three/fiber'
import { useState, useRef, useEffect, Suspense, RefObject } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { TileState } from './InstancedTiles'

type AnimationStyle = 'shake' | 'pulse'

const TileAnimationText = ({
  text,
  color = '#F38332',
  size = 0.5,
  visbilityKey,
  tileIndex,
  tileStates,
  animationStyle,
}: {
  text: string
  color: string
  size?: number
  visbilityKey: number
  tileIndex: number
  tileStates: RefObject<TileState[]>
  animationStyle?: AnimationStyle
}) => {
  const [opacity, setOpacity] = useState(1)
  const textRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    setOpacity(1)
  }, [visbilityKey])

  useFrame((state, delta) => {
    if (textRef.current) {
      textRef.current.position.x = tileStates.current[tileIndex].position.x
      textRef.current.position.y = tileStates.current[tileIndex].position.y + 0.5

      setOpacity((prev) => Math.max(prev - delta, 0))
      switch (animationStyle) {
        case 'shake':
          textRef.current.position.x += Math.sin(state.clock.elapsedTime * 30) * 0.01
          textRef.current.position.y += Math.cos(state.clock.elapsedTime * 30) * 0.01
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
        visible={opacity > 0}
        ref={textRef}
        position={[
          tileStates.current[tileIndex].position.x,
          tileStates.current[tileIndex].position.y + 0.5,
          tileStates.current[tileIndex].position.z,
        ]}
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
