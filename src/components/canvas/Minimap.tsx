import { useMemo, useState } from 'react'
import { Camera, DataTexture, FloatType, RGBAFormat, ShaderMaterial, Vector2, Vector3 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { WORLD_SIZE } from '@/constants'
import { Tile } from '@/models'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D tileData;
  uniform float worldSize;
  uniform vec2 currentPosition;
  varying vec2 vUv;

  float gaussian(vec2 i) {
    return exp(-dot(i, i) / 0.00005);
  }

  void main() {
    // Create circular mask
    vec2 center = vec2(0.5, 0.5);
    float radius = 0.5;
    float dist = distance(vUv, center);
    if (dist > radius) {
      discard;
    }

    vec2 normalizedPosition = currentPosition / worldSize;
    vec2 centeredUv = mod(vUv + normalizedPosition + center, 1.0);
    vec3 color = texture2D(tileData, centeredUv).rgb;

    // Apply color and transparency
    if (color.r > 0.5) {
      // Tile is flipped
      gl_FragColor = vec4(1.0, 1.0, 1.0, 0.7);
    } else {
      // Tile is not flipped
      gl_FragColor = vec4(0.1, 0.1, 0.1, 0.5);
    }

    // Draw current position
    // vec2 centerTile = vec2(64.0, 64.0);
    // vec2 tileCoord = floor(squareUv * 128.0);
    // if (distance(tileCoord, centerTile) < 1.5) {
    //   gl_FragColor = vec4(1.0, 0.0, 0.0, 0.2);
    // }

    // Add circular border
    float borderWidth = 0.05;
    if (dist > radius - borderWidth) {
      gl_FragColor = vec4(0.5, 0.5, 0.5, 0.8);
    }

    // Apply radial transparency
    gl_FragColor.a *= smoothstep(radius, radius - 0.1, dist);
  }
`

const Minimap = ({ tiles, cameraRef }: { tiles: Record<string, Tile>; cameraRef: React.RefObject<Camera> }) => {
  const { size } = useThree()
  const minimapSize = Math.min(size.width, size.height) * 0.25
  const [cameraTile, setCameraTile] = useState([0, 0])

  const tileData = useMemo(() => {
    const data = new Float32Array(WORLD_SIZE * WORLD_SIZE * 4)
    Object.values(tiles).forEach((tile) => {
      const index = (tile.y * WORLD_SIZE + tile.x) * 4
      data[index] = tile.address !== '0x0' ? 1 : 0
    })

    const tex = new DataTexture(data, WORLD_SIZE, WORLD_SIZE, RGBAFormat, FloatType)
    tex.needsUpdate = true
    return tex
  }, [tiles])

  const material = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        tileData: { value: tileData },
        worldSize: { value: WORLD_SIZE },
        currentPosition: { value: new Vector2(cameraTile[0], cameraTile[1]) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    })
  }, [tileData, cameraTile])

  useFrame((state, delta) => {
    if (!cameraRef.current) return
    if (state.clock.elapsedTime % 0.01 < delta) {
      const worldPosition = cameraRef.current.position.clone().subScalar(cameraRef.current.position.y)
      const cameraTileX = ((Math.floor(worldPosition.x / 1.1) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
      const cameraTileY = ((Math.floor(worldPosition.z / 1.1) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
      console.log(cameraTileX, cameraTileY)
      setCameraTile([cameraTileX, cameraTileY])
    }
  })

  return (
    <mesh
      position={[size.width / 2 - minimapSize / 2 - 10, -size.height / 2 + minimapSize / 2 + 10, 0]}
      rotation={[0, 0, 0]}
      scale={[minimapSize, minimapSize, 1]}
    >
      <circleGeometry args={[0.5, 32]} />
      <primitive object={material} />
    </mesh>
  )
}

export default Minimap
