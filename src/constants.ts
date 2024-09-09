export const TORII_URL = 'https://api.cartridge.gg/x/flippyflop-sepolia/torii'
export const TORII_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia'
// export const TORII_URL = 'http://localhost:8080'
// export const TORII_RPC_URL = 'http://localhost:5050'
export const TORII_RELAY_URL = '/ip4/127.0.0.1/udp/9091/webrtc-direct'

export const WORLD_ADDRESS = '0x3c542d498c799e1e8f6f7531c9c0a7ad72edd12fbc85cdcaeacbe572c3674d1'
export const TILE_MODEL_TAG = 'flippyflop-Tile'

export const CHUNK_SIZE = 20
export const CHUNKS = 10000 / (CHUNK_SIZE * CHUNK_SIZE)
export const CHUNKS_PER_DIMENSION = Math.sqrt(CHUNKS)
export const WORLD_SIZE = CHUNKS_PER_DIMENSION * CHUNK_SIZE

export const ACTIONS_ADDRESS = '0x04ea395b3f69925e20a382b910dbc905fd624b4315f38a02475e626fa36a874b'

export const TILE_ROBOT_SIDE_COLOR = '#14212E'
export const TILE_SMILEY_SIDE_COLOR = '#a86448'
