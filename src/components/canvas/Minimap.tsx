import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useState, useRef, useEffect } from 'react'
import { DataTexture, FloatType, RGBAFormat, ShaderMaterial, Vector2, Color } from 'three'

import { TEAMS, TILE_REGISTRY, WORLD_SIZE } from '@/constants'

import type { Tile } from '@/models'
import type { Camera } from 'three'
import { clamp } from 'three/src/math/MathUtils'
import { Html } from '@react-three/drei'

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
  uniform float zoomFactor;
  uniform bool enableBlur;
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
    vec2 adjustedUv = (vUv - vec2(0.5)) / radius;
    adjustedUv.y = -adjustedUv.y;  // Flip the Y coordinate
    
    // Apply zoom factor
    adjustedUv *= zoomFactor;
    
    vec2 sampleUv = mod(adjustedUv + normalizedPosition, 1.0);

    vec4 tileColor;

    if (enableBlur) {
      // Apply Gaussian blur
      vec4 blurredColor = vec4(0.0);
      float blurRadius = 2.0;
      float sigma = 0.1;
      float totalWeight = 0.0;

      for (float x = -blurRadius; x <= blurRadius; x += 1.0) {
        for (float y = -blurRadius; y <= blurRadius; y += 1.0) {
          vec2 offset = vec2(x, y) / worldSize;
          float weight = gaussianBlur(sigma, length(offset));
          blurredColor += texture2D(tileData, mod(sampleUv + offset, 1.0)) * weight;
          totalWeight += weight;
        }
      }
      tileColor = blurredColor / totalWeight;
    } else {
      // Sample tile data directly without blurring
      tileColor = texture2D(tileData, sampleUv);
    }

    // Apply color and transparency
    if (tileColor.r > 0.5) {
      // Tile is flipped, use the stored color
      gl_FragColor = vec4(tileColor.gba, 0.8);
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

const createMinimapMaterial = (zoomFactor: number, enableBlur: boolean) => {
  return new ShaderMaterial({
    uniforms: {
      tileData: { value: null },
      worldSize: { value: WORLD_SIZE },
      currentPosition: { value: new Vector2(0, 0) },
      color: { value: new Color(0, 0, 0) },
      zoomFactor: { value: zoomFactor },
      enableBlur: { value: enableBlur },
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
  const [zoomFactor, setZoomFactor] = useState(Number(localStorage.getItem('minimapZoomFactor') ?? 0.35))
  const [enableBlur, setEnableBlur] = useState(localStorage.getItem('minimapEnableBlur') === 'true')
  const materialRef = useRef<ShaderMaterial>(createMinimapMaterial(zoomFactor, enableBlur))
  const [hovered, setHovered] = useState<boolean>(false)

  useEffect(() => {
    localStorage.setItem('minimapZoomFactor', zoomFactor.toString())
  }, [zoomFactor])

  useEffect(() => {
    localStorage.setItem('minimapEnableBlur', enableBlur.toString())
  }, [enableBlur])

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (hovered) {
        event.stopPropagation()
        setZoomFactor((prev) => clamp(prev + event.deltaY * 0.001, 0.1, 1))
      }
    }
    window.addEventListener('wheel', handleWheel, {
      capture: true,
    })
    return () => window.removeEventListener('wheel', handleWheel, { capture: true })
  }, [hovered])

  const tileData = useMemo(() => {
    const data = new Float32Array(WORLD_SIZE * WORLD_SIZE * 4)
    Object.values(tiles).forEach((tile) => {
      const index = (tile.y * WORLD_SIZE + tile.x) * 4
      data[index] = tile.address !== '0x0' ? 1 : 0
      data[index + 1] = parseInt(TILE_REGISTRY[TEAMS[tile.team]].face.slice(1, 3), 16) / 255
      data[index + 2] = parseInt(TILE_REGISTRY[TEAMS[tile.team]].face.slice(3, 5), 16) / 255
      data[index + 3] = parseInt(TILE_REGISTRY[TEAMS[tile.team]].face.slice(5, 7), 16) / 255
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

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.zoomFactor.value = zoomFactor
      materialRef.current.uniforms.enableBlur.value = enableBlur
    }
  }, [zoomFactor, enableBlur])

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
    <>
      <group
        position={[size.width / 2 - minimapSize / 2 - 10, -size.height / 2 + minimapSize / 2 + 10, 0]}
        rotation={[0, 0, -Math.PI / 4]}
        scale={[minimapSize, minimapSize, 1]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh>
          <planeGeometry args={[1, 1]} />
          <primitive object={materialRef.current} />
        </mesh>
      </group>
      <Html position={[size.width / 2 - minimapSize * 0.28, -size.height / 2 + minimapSize * 0.3, 0]}>
        <div
          onClick={(e) => {
            e.stopPropagation()
            setEnableBlur(!enableBlur)
          }}
          className='opacity-80 text-white rounded-full cursor-pointer bg-black/50 border border-white/50 w-10 h-10 flex items-center justify-center backdrop-blur pointer-events-auto hover:bg-black/50 hover:border-white transition-all duration-200'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z' />
          </svg>
        </div>
      </Html>
    </>
  )
}

export default Minimap
