import manifest from '../flippyflop/manifests/sepolia/deployment/manifest.json'

export const TORII_URL = 'https://t.nsrdm.com'
// sepolia
export const TORII_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia'
// katana
// export const TORII_RPC_URL = 'https://api.cartridge.gg/x/flippyflop/katana'
export const TORII_RELAY_URL = '/ip4/127.0.0.1/udp/9091/webrtc-direct'

// sepolia
export const WORLD_ADDRESS = manifest.world.address
// katana
// export const WORLD_ADDRESS = '0x69923899a79b42e2db65765501305ad03d5c04ceca2d991962db351fc414c23'
export const TILE_MODEL_TAG = 'flippyflop-Tile'

export const CHUNK_SIZE = 16
export const CHUNKS = 65536 / (CHUNK_SIZE * CHUNK_SIZE)
export const CHUNKS_PER_DIMENSION = Math.sqrt(CHUNKS)
export const WORLD_SIZE = CHUNKS_PER_DIMENSION * CHUNK_SIZE

// sepolia
export const ACTIONS_ADDRESS = manifest.contracts.find((contract) => contract.tag === 'flippyflop-actions')?.address
export const FLIP_ADDRESS = manifest.contracts.find((contract) => contract.tag === 'flippyflop-Flip')?.address
export const CLAIMS_ADDRESS = manifest.contracts.find((contract) => contract.tag === 'flippyflop-game')?.address

console.log(ACTIONS_ADDRESS, FLIP_ADDRESS, CLAIMS_ADDRESS)
// katana
// export const ACTIONS_ADDRESS = '0x73d81392edc741306bfdef1fce47ce55d5fd1b18914db4ac4257172ddb0f427'

export const TEAMS = {
  0: 'orange' as const,
  1: 'green' as const,
  2: 'red' as const,
  3: 'blue' as const,
  4: 'pink' as const,
  5: 'purple' as const,
}

export const TILE_REGISTRY = {
  robot: {
    face: '#14212E',
    border: '#14212E',
    background: '#14212E',
    texture: '/textures/ROBOT.png',
    emoji: '🤖',
  },
  orange: {
    face: '#F38332',
    // face: '#a86448',
    border: '#FCB887',
    background: '#FCD7BC',
    texture: '/textures/smiley/ORANGE.png',
    emoji: '🍊',
  },
  green: {
    face: '#4D9E3F',
    border: '#7CD974',
    background: '#C1FCBC',
    texture: '/textures/smiley/GREEN.png',
    emoji: '🐛',
  },
  red: {
    face: '#AB4444',
    border: '#D97474',
    background: '#FCBCBC',
    texture: '/textures/smiley/RED.png',
    emoji: '🍓',
  },
  blue: {
    face: '#397B91',
    border: '#74C0D9',
    background: '#BCECFC',
    texture: '/textures/smiley/BLUE.png',
    emoji: '🐳',
  },
  pink: {
    face: '#7944AB',
    border: '#B974D9',
    background: '#EFBCFC',
    texture: '/textures/smiley/PINK.png',
    emoji: '🌸',
  },
  purple: {
    face: '#4B4ABA',
    border: '#7674D9',
    background: '#BDBCFC',
    texture: '/textures/smiley/PURPLE.png',
    emoji: '🦄',
  },
}
