import { Tile } from './models'

export const TORII_URL = 'https://api.cartridge.gg/x/flippyflop-sepolia/torii'
export const TORII_RPC_URL = 'https://api.cartridge.gg/x/starknet/sepolia'
export const TORII_RELAY_URL =
  '/ip4/127.0.0.1/udp/9091/webrtc-direct/certhash/uEiAH_v2-EcO6qnk1FO6eZHXIruJE5snCR8mQ7CPR5rNu9w'

export const WORLD_ADDRESS = '0x4ffd05bfe505d883481ab1bba815301c482f44cc368aa141ed83d4b2eba4a83'
export const TILE_MODEL_TAG = 'flippyflop-Tile'

export const CHUNK_SIZE = 20
export const CHUNKS = 10000 / (CHUNK_SIZE * CHUNK_SIZE)
export const CHUNKS_PER_DIMENSION = Math.sqrt(CHUNKS)
export const WORLD_SIZE = CHUNKS_PER_DIMENSION * CHUNK_SIZE

export const ACTIONS_ADDRESS = '0x77d04bd307605c021a1def7987278475342f4ea2581f7c49930e9269bedf476'

export const TILE_ROBOT_SIDE_COLOR = '#14212E'
export const TILE_SMILEY_SIDE_COLOR = '#a86448'

// export const INITIAL_TILES_STATE = Object.fromEntries(
//   PRECOMPUTED_TILE_HASHES.slice(0, 100).map((hash, index) => {
//     const x = index % 100
//     const y = Math.floor(index / 100)

//     return [hash, { x, y, flipped: '0x0' } as Tile]
//   }),
// )
