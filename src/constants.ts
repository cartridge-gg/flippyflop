// export const TORII_URL = 'https://api.cartridge.gg/x/flippyflop-sepolia/torii'
// export const TORII_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia'
export const TORII_URL = 'http://localhost:8080'
export const TORII_RPC_URL = 'http://localhost:5050'
export const TORII_RELAY_URL = '/ip4/127.0.0.1/udp/9091/webrtc-direct'

export const WORLD_ADDRESS = '0x35819a8df0a85781f9d8793ea1b3163e94812d41707a21a6fb586d00e5f7a16'
export const TILE_MODEL_TAG = 'flippyflop-Tile'

export const CHUNK_SIZE = 20
export const CHUNKS = 10000 / (CHUNK_SIZE * CHUNK_SIZE)
export const CHUNKS_PER_DIMENSION = Math.sqrt(CHUNKS)
export const WORLD_SIZE = CHUNKS_PER_DIMENSION * CHUNK_SIZE

export const ACTIONS_ADDRESS = '0x68f0a9e8c6b953ed6afcb557cd8de6d6cd763d4b735f9a3081ce48271c44965'

export const TILE_ROBOT_SIDE_COLOR = '#14212E'
export const TILE_SMILEY_SIDE_COLOR = '#a86448'
