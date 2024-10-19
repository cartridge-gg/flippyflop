export default {
  vertex: /* glsl */ `
        attribute float team;

        varying float vTeam;
        varying vec2 csm_vUv;

        void main() {
          vTeam = team;
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

        varying float vTeam;
        varying vec2 csm_vUv;

        void main() {
          vec4 texColor;
          if (vTeam == 0.0) {
            texColor = texture2D(orangeTexture, csm_vUv);
          } else if (vTeam == 1.0) {
            texColor = texture2D(greenTexture, csm_vUv);
          } else if (vTeam == 2.0) {
            texColor = texture2D(redTexture, csm_vUv);
          } else if (vTeam == 3.0) {
            texColor = texture2D(blueTexture, csm_vUv);
          } else if (vTeam == 4.0) {
            texColor = texture2D(pinkTexture, csm_vUv);
          } else if (vTeam == 5.0) {
            texColor = texture2D(purpleTexture, csm_vUv);
          }
            
          csm_FragColor = texColor;
        }
      `,
}
