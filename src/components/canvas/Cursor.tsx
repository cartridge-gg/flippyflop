import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Color, HSL } from 'three'
import { Sphere, Text } from '@react-three/drei'

const calculateColorFromFelt = (felt) => {
  const hexColor = felt.toString(16).slice(-6).padStart(6, '0')
  const color = new Color(`#${hexColor}`)
  const hsl = {} as HSL
  color.getHSL(hsl)
  hsl.l = Math.max(hsl.l, 0.4)
  color.setHSL(hsl.h, hsl.s, hsl.l)
  return color
}

const UserCursor = ({ position, identity }) => {
  const cursorRef = useRef<any>()
  const targetPosition = useRef(new Vector3(position.x, 0.5, position.y))
  const currentPosition = useRef(new Vector3(position.x, 0.5, position.y))
  const color = calculateColorFromFelt(identity)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    targetPosition.current.set(position.x, 0.5, position.y)
    // if (lastMessage && lastMessage !== '') {
    //   setShowMessage(true)
    //   const timer = setTimeout(() => setShowMessage(false), 5000) // Hide message after 5 seconds
    //   return () => clearTimeout(timer)
    // }
  }, [position])

  useFrame((state, delta) => {
    currentPosition.current.lerp(targetPosition.current, 0.1)
    cursorRef.current.position.copy(currentPosition.current)
  })

  return (
    <group ref={cursorRef}>
      <Sphere args={[0.2, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </Sphere>
      {/* {showMessage && lastMessage && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.2}
          maxWidth={2}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign='center'
          font='/fonts/SaladDaysRegular.wofff' // Replace with the path to your preferred font
          anchorX='center'
          anchorY='bottom'
        >
          {lastMessage}
          <meshBasicMaterial color='white' />
        </Text>
      )} */}
    </group>
  )
}

export default UserCursor
