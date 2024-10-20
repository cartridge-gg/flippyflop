export default {
  vertex: /* glsl */ `
        attribute float team;
        attribute float powerup;

        varying float vTeam;
        varying float vPowerup;
        varying vec2 csm_vUv;

        void main() {
          vTeam = team;
          vPowerup = powerup;
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

        varying float vTeam;
        varying float vPowerup;
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
            
          csm_FragColor = texColor;
        }
      `,
}
