export const TORII_URL = 'https://api.cartridge.gg/x/flippyflop-sepolia/torii'
export const TORII_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia'
// export const TORII_URL = 'http://localhost:8080'
// export const TORII_RPC_URL = 'http://localhost:5050'
export const TORII_RELAY_URL = '/ip4/127.0.0.1/udp/9091/webrtc-direct'

export const WORLD_ADDRESS = '0x53b7efae79ce1d7729828bb6dee2cee09358fde4c4325805cf97678919a4855'
export const TILE_MODEL_TAG = 'flippyflop-Tile'

export const CHUNK_SIZE = 20
export const CHUNKS = 10000 / (CHUNK_SIZE * CHUNK_SIZE)
export const CHUNKS_PER_DIMENSION = Math.sqrt(CHUNKS)
export const WORLD_SIZE = CHUNKS_PER_DIMENSION * CHUNK_SIZE

export const ACTIONS_ADDRESS = '0x04a38587ad1b4677196d855f0ac994b401da32c379a728f51df2ea4d13f4a8bb'

export const TILE_ROBOT_SIDE_COLOR = '#14212E'
export const TILE_SMILEY_SIDE_COLOR = '#a86448'
