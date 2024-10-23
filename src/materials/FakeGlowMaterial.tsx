import React, { useMemo } from 'react'
import { shaderMaterial } from '@react-three/drei'
import type { Object3DNode } from '@react-three/fiber'
import { extend } from '@react-three/fiber'
import type { Material, Side } from 'three'
import { AdditiveBlending, Color, FrontSide } from 'three'
import type { ColorRepresentation } from 'three'

/**
 * @typedef {Object} FakeGlowMaterialProps
 * @property {Number} [falloff=0.1] - Controls the value of the Falloff effect. Ranges from 0.0 to 1.0.
 * @property {Number} [glowInternalRadius=6.0] - Controls the internal glow radius. Ranges from -1.0 to 1.0. Set a darker color to get the fresnel effect only.
 * @property {String} [glowColor='#00ff00'] - Specifies the color of the hologram. Use hexadecimal format.
 * @property {Number} [glowSharpness=1.0] - Specifies the edges sharpness. Defaults to 1.0.
 * @property {Number} [side=THREE.FrontSide] - Specifies side for the material, as THREE.DoubleSide. Options are "THREE.FrontSide", "THREE.BackSide", "THREE.DoubleSide". Defaults to "THREE.FrontSide".
 */

/**
 * FakeGlow material component by Anderson Mancini - Feb 2024.
 * @param {FakeGlowMaterialProps} props - Props for the FakeGlowMaterial component.
 */

declare module '@react-three/fiber' {
  interface ThreeElements {
    fakeGlowMaterial: Object3DNode<Material, typeof FakeGlowMaterial>
  }
}

type Props = {
  falloff?: number
  glowInternalRadius?: number
  glowColor?: ColorRepresentation
  glowSharpness?: number
  side?: Side
}

export const FakeGlowMaterial = ({
  falloff = 0.1,
  glowInternalRadius = 6,
  glowColor = '#00ff00',
  glowSharpness = 1,
  side = FrontSide, // Adjust the PropTypes as per your requirements
}: Props) => {
  const FakeGlowMaterial = useMemo(() => {
    return shaderMaterial(
      {
        falloffAmount: falloff,
        glowInternalRadius,
        glowColor: new Color(glowColor),
        glowSharpness,
      },
      /*GLSL */
      `
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
        vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
        vPosition = modelPosition.xyz;
        vNormal = modelNormal.xyz;

      }`,
      /*GLSL */
      ` 
      uniform vec3 glowColor;
      uniform float falloffAmount;
      uniform float glowSharpness;
      uniform float glowInternalRadius;

      varying vec3 vPosition;
      varying vec3 vNormal;

      void main()
      {
        // Normal
        vec3 normal = normalize(vNormal);
        if(!gl_FrontFacing)
            normal *= - 1.0;
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = dot(viewDirection, normal);
        fresnel = pow(fresnel, glowInternalRadius + 0.1);
        float falloff = smoothstep(0., falloffAmount, fresnel);
        float fakeGlow = fresnel;
        fakeGlow += fresnel * glowSharpness;
        fakeGlow *= falloff;
        gl_FragColor = vec4(clamp(glowColor * fresnel, 0., 1.0), clamp(fakeGlow, 0., 1.0));

      }`,
    )
  }, [falloff, glowInternalRadius, glowColor, glowSharpness])

  extend({ FakeGlowMaterial })

  return (
    <fakeGlowMaterial
      key={FakeGlowMaterial.key}
      side={side}
      transparent={true}
      blending={AdditiveBlending}
      depthTest={false}
    />
  )
}
