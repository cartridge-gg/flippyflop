export const TORII_URL = 'https://t.nsrdm.com'
// sepolia
// export const TORII_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia'
// katana
export const TORII_RPC_URL = 'https://api.cartridge.gg/x/flippyflop/katana'
export const TORII_RELAY_URL = '/ip4/127.0.0.1/udp/9091/webrtc-direct'

// sepolia
// export const WORLD_ADDRESS = '0x43cba5bc94f3ec38aee9841c8c45edf899e77ac944a88eb732b36ef3a4c2ca2'
// katana
export const WORLD_ADDRESS = '0x69923899a79b42e2db65765501305ad03d5c04ceca2d991962db351fc414c23'
export const TILE_MODEL_TAG = 'flippyflop-Tile'

export const CHUNK_SIZE = 16
export const CHUNKS = 65536 / (CHUNK_SIZE * CHUNK_SIZE)
export const CHUNKS_PER_DIMENSION = Math.sqrt(CHUNKS)
export const WORLD_SIZE = CHUNKS_PER_DIMENSION * CHUNK_SIZE

// sepolia
// export const ACTIONS_ADDRESS = '0x0165A91F138a5C5f5016a0afE3412b551559B3DE4D89357282fe145E3E3c404b'
// katana
export const ACTIONS_ADDRESS = '0x73d81392edc741306bfdef1fce47ce55d5fd1b18914db4ac4257172ddb0f427'

export const TILE_ROBOT_SIDE_COLOR = '#14212E'
export const TILE_SMILEY_SIDE_COLOR = '#a86448'
