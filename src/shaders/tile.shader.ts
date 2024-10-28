export default {
  vertex: /* glsl */ `
        attribute float team;
        attribute float powerup;
        attribute float mine;

        varying float vTeam;
        varying float vPowerup;
        varying float vMine;
        varying vec2 csm_vUv;

        void main() {
          vTeam = team;
          vPowerup = powerup;
          vMine = mine;
          csm_vUv = uv;

          csm_PositionRaw = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
        }
      `,
  fragment: /* glsl */ `
        uniform sampler2D robotTexture;
        uniform sampler2D orangeTexture;
        uniform sampler2D greenTexture;
        uniform sampler2D redTexture;
        uniform sampler2D blueTexture;
        uniform sampler2D pinkTexture;
        uniform sampler2D purpleTexture;
        uniform sampler2D bonusOrangeTexture;
        uniform sampler2D bonusGreenTexture;
        uniform sampler2D bonusRedTexture;
        uniform sampler2D bonusBlueTexture;
        uniform sampler2D bonusPinkTexture;
        uniform sampler2D bonusPurpleTexture;
        uniform float time;

        varying float vTeam;
        varying float vPowerup;
        varying float vMine;
        varying vec2 csm_vUv;

        void main() {
          vec4 texColor;
          if (vTeam == 0.0) {
            texColor = vPowerup == 0.0 ? texture2D(orangeTexture, csm_vUv) : texture2D(bonusOrangeTexture, csm_vUv);
          } else if (vTeam == 1.0) {
            texColor = vPowerup == 0.0 ? texture2D(greenTexture, csm_vUv) : texture2D(bonusGreenTexture, csm_vUv);
          } else if (vTeam == 2.0) {
            texColor = vPowerup == 0.0 ? texture2D(redTexture, csm_vUv) : texture2D(bonusRedTexture, csm_vUv);
          } else if (vTeam == 3.0) {
            texColor = vPowerup == 0.0 ? texture2D(blueTexture, csm_vUv) : texture2D(bonusBlueTexture, csm_vUv);
          } else if (vTeam == 4.0) {
            texColor = vPowerup == 0.0 ? texture2D(pinkTexture, csm_vUv) : texture2D(bonusPinkTexture, csm_vUv);
          } else if (vTeam == 5.0) {
            texColor = vPowerup == 0.0 ? texture2D(purpleTexture, csm_vUv) : texture2D(bonusPurpleTexture, csm_vUv);
          }
          
          // Handle mine effects first
          if (vMine > 0.0) {
            // Team-specific brightness for mines
            if (vTeam == 0.0) {
              texColor.rgb *= 1.7; // Orange
            } else if (vTeam == 1.0) {
              texColor.rgb *= 1.45; // Green
            } else if (vTeam == 2.0) {
              texColor.rgb *= 2.0; // Red
            } else if (vTeam == 3.0) {
              texColor.rgb *= 1.6; // Blue
            } else if (vTeam == 4.0) {
              texColor.rgb *= 2.0; // Pink
            } else if (vTeam == 5.0) {
              texColor.rgb *= 2.3; // Purple
            }
            
            // Add a subtle golden tint
            vec3 tintColor = vec3(1.0, 0.95, 0.8);
            texColor.rgb = mix(texColor.rgb, texColor.rgb * tintColor, 2.0);
          }
          // Handle powerup effects only if it's not a mine
          else if (vPowerup > 0.0) {
            // Calculate pulse effect
            float pulseEffect = 0.2 * sin(time * 1.5) + 1.2;

            if (vTeam == 0.0) {
              texColor.rgb *= 1.1 * pulseEffect; // Orange
            } else if (vTeam == 1.0) {
              texColor.rgb *= 1.05 * pulseEffect; // Green
            } else if (vTeam == 2.0) {
              texColor.rgb *= 1.4 * pulseEffect; // Red
            } else if (vTeam == 3.0) {
              texColor.rgb *= 1.1 * pulseEffect; // Blue
            } else if (vTeam == 4.0) {
              texColor.rgb *= 1.3 * pulseEffect; // Pink
            } else if (vTeam == 5.0) {
              texColor.rgb *= 1.45 * pulseEffect; // Purple
            }
          }
            
          csm_FragColor = texColor;
        }
      `,
}
