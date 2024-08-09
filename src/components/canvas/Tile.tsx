'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Ref, useMemo, useRef, useState } from 'react'
import { Line, useCursor, MeshDistortMaterial } from '@react-three/drei'
import { useRouter } from 'next/navigation'
import { Tile as TileModel } from 'src/models'

export default function Tile({ tile, onClick, ...props }: { tile: TileModel; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const meshRef: Ref<
    THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  > = useRef()

  useCursor(hovered)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, tile.flipped ? Math.PI : 0, 0.1)
    }
  })

  return (
    <group position={[tile.x, tile.y, 0]} {...props}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial color={tile.flipped || hovered ? 'hotpink' : '#1fb2f5'} />
      </mesh>
      {/* Back side of the tile */}
      <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[1, 1, 0.01]} />
        <meshStandardMaterial color='#f1f1f1' />
      </mesh>
    </group>
  )
}
