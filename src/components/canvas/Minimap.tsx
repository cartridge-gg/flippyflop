import { useMemo, useState, useRef, useEffect } from 'react'
import {
  Camera,
  DataTexture,
  FloatType,
  RGBAFormat,
  ShaderMaterial,
  Vector2,
  Vector3,
  MeshBasicMaterial,
  Color,
} from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { TEAMS, TILE_REGISTRY, WORLD_SIZE } from '@/constants'
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
  uniform vec3 color;
  varying vec2 vUv;

  // Gaussian blur function
  float gaussianBlur(float sigma, float x) {
    return exp(-(x * x) / (2.0 * sigma * sigma));
  }

  void main() {
    // Create circular mask
    vec2 center = vec2(0.5, 0.5);
    float radius = 0.5;
    float dist = distance(vUv, center);
    if (dist > radius) {
      discard;
    }

    // Calculate UV coordinates for sampling tile data
    vec2 normalizedPosition = currentPosition / worldSize;
    vec2 adjustedUv = (vUv - center) / radius;
    adjustedUv.y = 1.0 - adjustedUv.y;  // Flip the Y coordinate
    vec2 sampleUv = mod(adjustedUv + normalizedPosition, 1.0);

    // Apply Gaussian blur
    vec4 blurredColor = vec4(0.0);
    float blurRadius = 2.0;
    float sigma = 1.0;
    float totalWeight = 0.00001;

    for (float x = -blurRadius; x <= blurRadius; x += 1.0) {
      for (float y = -blurRadius; y <= blurRadius; y += 1.0) {
        vec2 offset = vec2(x, y) / worldSize;
        float weight = gaussianBlur(sigma, length(offset));
        blurredColor += texture2D(tileData, mod(sampleUv + offset, 1.0)) * weight;
        totalWeight += weight;
      }
    }
    blurredColor /= totalWeight;

    // Apply color and transparency
    if (blurredColor.r > 0.5) {
      // Tile is flipped
      gl_FragColor = vec4(1.0, 1.0, 1.0, 0.7);
    } else {
      // Tile is not flipped
      gl_FragColor = vec4(0.1, 0.1, 0.1, 0.5);
    }

    // Draw current position indicator
    float indicatorSize = 0.01;
    if (distance(vUv, center) < indicatorSize) {
      gl_FragColor = vec4(color, 1.0); 
    }

    // Add circular border
    float borderWidth = 0.05;
    if (dist > radius - borderWidth) {
      gl_FragColor = vec4(0.5, 0.5, 0.5, 0.4);
    }

    // Apply radial transparency
    gl_FragColor.a *= smoothstep(radius, radius - 0.1, dist);
  }
`

const createMinimapMaterial = () => {
  return new ShaderMaterial({
    uniforms: {
      tileData: { value: null },
      worldSize: { value: WORLD_SIZE },
      currentPosition: { value: new Vector2(0, 0) },
      color: { value: new Color(0, 0, 0) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  })
}

const Minimap = ({
  tiles,
  cameraRef,
  selectedTeam,
}: {
  tiles: Record<string, Tile>
  cameraRef: React.RefObject<Camera>
  selectedTeam: number
}) => {
  const { size } = useThree()
  const minimapSize = Math.min(size.width, size.height) * 0.25
  const [cameraTile, setCameraTile] = useState([0, 0])
  const materialRef = useRef<ShaderMaterial>(createMinimapMaterial())

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

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.tileData.value = tileData
    }
  }, [tileData])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.currentPosition.value.set(cameraTile[0], cameraTile[1])
    }
  }, [cameraTile])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.set(TILE_REGISTRY[TEAMS[selectedTeam]].background)
    }
  }, [selectedTeam])

  useFrame((state, delta) => {
    if (!cameraRef.current) return
    if (state.clock.elapsedTime % 0.01 < delta) {
      const worldPosition = cameraRef.current.position.clone().subScalar(cameraRef.current.position.y)
      const cameraTileX = ((Math.floor(worldPosition.x / 1.1) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
      const cameraTileY = ((Math.floor(worldPosition.z / 1.1) % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE
      setCameraTile([cameraTileX, cameraTileY])
    }
  })

  return (
    <group
      position={[size.width / 2 - minimapSize / 2 - 10, -size.height / 2 + minimapSize / 2 + 10, 0]}
      rotation={[0, 0, -Math.PI / 4]}
      scale={[minimapSize, minimapSize, 1]}
    >
      <mesh>
        <planeGeometry args={[1, 1]} />
        <primitive object={materialRef.current} />
      </mesh>
    </group>
  )
}

export default Minimap
