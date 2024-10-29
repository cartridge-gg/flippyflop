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
        uniform sampler2D textureAtlas;  // Single texture containing all team textures
        uniform float time;

        varying float vTeam;
        varying float vPowerup;
        varying float vMine;
        varying vec2 csm_vUv;

        void main() {
          // Atlas layout: [team0, team1, ..., team5, bonus0, ..., bonus5, locked0, ..., locked5]
          // Each texture is 256 pixels wide in an atlas that's 256 * 18 pixels wide total
          float teamOffset = vTeam;  // Base team texture offset (0-5)
          float section = 0.0;       // 0 for normal, 6 for bonus, 12 for locked
          
          if (vPowerup == 0.0) {
            section = 0.0;           // Regular team textures (first section)
          } else if (vPowerup > 2.0) {
            section = 12.0;          // Locked textures (last section)
          } else {
            section = 6.0;           // Bonus textures (middle section)
          }

          // Calculate final offset (0-17) and convert to UV coordinate (0-1)
          float finalOffset = (teamOffset + section) / 18.0;
          
          // Adjust UV coordinates to sample from the correct part of the atlas
          vec2 adjustedUV = vec2(csm_vUv.x / 18.0 + finalOffset, csm_vUv.y);
          vec4 texColor = texture2D(textureAtlas, adjustedUV);
          
          // Handle mine effects first
          if (vMine > 0.0) {
            float mineBrightness;
            if (vTeam == 0.0) mineBrightness = 1.7;      // Orange
            else if (vTeam == 1.0) mineBrightness = 1.45; // Green
            else if (vTeam == 2.0) mineBrightness = 2.0;  // Red
            else if (vTeam == 3.0) mineBrightness = 1.6;  // Blue
            else if (vTeam == 4.0) mineBrightness = 2.0;  // Pink
            else mineBrightness = 2.3;                    // Purple
            
            texColor.rgb *= mineBrightness;
            
            // Add a subtle golden tint
            vec3 tintColor = vec3(1.0, 0.95, 0.8);
            texColor.rgb = mix(texColor.rgb, texColor.rgb * tintColor, 2.0);
          }
          // Handle powerup effects only if it's not a mine
          else if (vPowerup > 0.0) {
            float pulseEffect = 0.2 * sin(time * 1.5) + 1.2;
            float powerupBrightness;
            
            if (vTeam == 0.0) powerupBrightness = 1.25;      // Orange
            else if (vTeam == 1.0) powerupBrightness = 1.05; // Green
            else if (vTeam == 2.0) powerupBrightness = 1.4;  // Red
            else if (vTeam == 3.0) powerupBrightness = 1.1;  // Blue
            else if (vTeam == 4.0) powerupBrightness = 1.3;  // Pink
            else powerupBrightness = 1.45;                   // Purple
            
            texColor.rgb *= powerupBrightness * pulseEffect;
          }
            
          csm_FragColor = texColor;
        }
      `,
}
