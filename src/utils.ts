import { ToriiClient } from '@/libs/dojo.c/dojo_c'
import { CHUNK_SIZE, CHUNKS, CHUNKS_PER_DIMENSION, TILE_MODEL_TAG } from './constants'
import { Chunk, Powerup, Tile } from './models'

export function getChunkAndLocalPosition(x: number, y: number) {
  const chunkX = Math.floor(x / CHUNK_SIZE)
  const chunkY = Math.floor(y / CHUNK_SIZE)
  const localX = x % CHUNK_SIZE
  const localY = y % CHUNK_SIZE
  const chunkIdx = chunkX * CHUNKS + chunkY
  const localIdx = localY * CHUNK_SIZE + localX
  return { chunkIdx, localIdx, chunkX, chunkY, localX, localY }
}

export async function fetchUsername(address: string) {
  const data = await (
    await fetch('https://api.cartridge.gg/query', {
      headers: {
        'content-type': 'application/json',
      },
      body: `{"query":"query {\\n  accounts(where:{\\n    contractAddress: \\"${address}\\"\\n  }) {\\n    edges {\\n      node {\\n        id,\\ncontractAddress      }\\n    }\\n  }\\n}"}`,
      method: 'POST',
    })
  ).json()

  return data.data.accounts.edges?.[0]?.node?.id
}

export async function fetchUsernames(addresses: string[]) {
  const data = await (
    await fetch('https://api.cartridge.gg/query', {
      headers: {
        'content-type': 'application/json',
      },
      body: `{"query":"query {\\n  accounts(where:{\\n    or: [${addresses
        .map((address) => `{contractAddressHasPrefix: \\"${address}\\"}`)
        .join(',')}]\\n  }) {\\n    edges {\\n      node {\\n        id,\\ncontractAddress      }\\n    }\\n  }\\n}"}`,
      method: 'POST',
    })
  ).json()

  return data.data.accounts.edges.reduce((acc, edge) => {
    acc[edge.node.contractAddress] = edge.node.id
    acc[maskAddress(edge.node.contractAddress)] = edge.node.id
    return acc
  }, {})
}

export function generateUserTypedData(
  identity: string,
  chunkX: number,
  chunkY: number,
  localX: number,
  localY: number,
) {
  return {
    types: {
      StarknetDomain: [
        { name: 'name', type: 'shortstring' },
        { name: 'version', type: 'shortstring' },
        { name: 'chainId', type: 'shortstring' },
        { name: 'revision', type: 'shortstring' },
      ],
      OffchainMessage: [
        { name: 'model', type: 'shortstring' },
        { name: 'flippyflop-User', type: 'Model' },
      ],
      Model: [
        { name: 'identity', type: 'ContractAddress' },
        { name: 'last_message', type: 'string' },
        { name: 'hovering_tile_x', type: 'u32' },
        { name: 'hovering_tile_y', type: 'u32' },
      ],
    },
    primaryType: 'OffchainMessage',
    domain: {
      name: 'Flippyflop',
      version: '1',
      chainId: '1',
      revision: '1',
    },
    message: {
      model: 'flippyflop-User',
      'flippyflop-User': {
        identity,
        last_message: '',
        hovering_tile_x: chunkX * CHUNK_SIZE + localX,
        hovering_tile_y: chunkY * CHUNK_SIZE + localY,
      },
    },
  }
}

export function parseModel<T>(model: any): T {
  let result = {} as T
  for (const key in model) {
    result[key] = model[key].value
  }

  return result
}

export function parseTileModel(model: any): Tile {
  const packedFlipped = model.flipped.value
  const address = maskAddress(packedFlipped)
  const powerup = address !== '0x0' ? parseInt(packedFlipped.substring(61, 63), 16) : Powerup.None
  const powerupValue = address !== '0x0' ? parseInt(packedFlipped.substring(63, 65), 16) : 0

  return {
    x: model.x.value,
    y: model.y.value,
    address: address,
    powerup: powerup,
    powerupValue: powerupValue,
  }
}

export function initializeTiles(x: number, y: number, width = CHUNK_SIZE, height = CHUNK_SIZE): Tile[] {
  const tiles = []
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      tiles.push({ x: x + i, y: y + j, address: '0x0', powerup: Powerup.None, powerupValue: 0 } as Tile)
    }
  }

  return tiles
}

export const fetchChunk = async (client: any, x: number, y: number) =>
  await client.getEntities({
    clause: {
      Composite: {
        clauses: [
          {
            Member: {
              member: 'x',
              model: TILE_MODEL_TAG,
              operator: 'Gte',
              value: { U32: x * CHUNK_SIZE },
            },
          },
          {
            Member: {
              member: 'x',
              model: TILE_MODEL_TAG,
              operator: 'Lt',
              value: { U32: (x + 1) * CHUNK_SIZE },
            },
          },
          {
            Member: {
              member: 'y',
              model: TILE_MODEL_TAG,
              operator: 'Gte',
              value: { U32: y * CHUNK_SIZE },
            },
          },
          {
            Member: {
              member: 'y',
              model: TILE_MODEL_TAG,
              operator: 'Lt',
              value: { U32: (y + 1) * CHUNK_SIZE },
            },
          },
        ],
        operator: 'And',
      },
    },
    limit: CHUNK_SIZE * CHUNK_SIZE,
    offset: 0,
  })

export const findLeastPopulatedArea = (tiles: Tile[]): [number, number] => {
  const grid = Array(CHUNKS_PER_DIMENSION)
    .fill(0)
    .map(() => Array(CHUNKS_PER_DIMENSION).fill(0))

  // Count flipped tiles in each chunk
  Object.values(tiles).forEach((tile) => {
    if (tile.address !== '0x0') {
      const chunkX = Math.floor(tile.x / CHUNK_SIZE)
      const chunkY = Math.floor(tile.y / CHUNK_SIZE)
      grid[chunkY][chunkX]++
    }
  })

  // Find the chunk with the minimum count
  let minCount = Infinity
  let minChunkX = 0
  let minChunkY = 0

  for (let y = 0; y < CHUNKS_PER_DIMENSION; y++) {
    for (let x = 0; x < CHUNKS_PER_DIMENSION; x++) {
      if (grid[y][x] < minCount) {
        minCount = grid[y][x]
        minChunkX = x
        minChunkY = y
      }
    }
  }

  // Return the center of the least populated chunk
  return [(minChunkX + 0.5) * CHUNK_SIZE, (minChunkY + 0.5) * CHUNK_SIZE]
}

export function formatAddress(address: string) {
  return `${address.slice(0, 8)}`
}

export async function fetchAllEntities(
  client: ToriiClient,
  set?: React.Dispatch<React.SetStateAction<Record<string, Tile>>>,
): Promise<Record<string, Tile>> {
  let allTiles: Record<string, Tile> = {}
  let cursor = 0
  let hasMore = true
  const size = 10000

  while (hasMore) {
    const entities = await client.getEntities({
      clause: {
        Member: {
          member: 'flipped',
          model: TILE_MODEL_TAG,
          operator: 'Neq',
          value: {
            Primitive: {
              ContractAddress: '0x0',
            },
          },
        },
      },
      limit: size,
      offset: cursor,
    })

    const fetchedTiles = Object.values(entities).reduce(
      (acc, entity) => {
        const tile = parseTileModel(entity[TILE_MODEL_TAG])
        acc[`${tile.x},${tile.y}`] = tile
        return acc
      },
      {} as Record<string, Tile>,
    )

    allTiles = { ...allTiles, ...fetchedTiles }

    if (set) {
      set((prev) => ({ ...prev, ...fetchedTiles }))
    }

    const fetchedCount = Object.keys(entities).length
    cursor += fetchedCount
    hasMore = fetchedCount === size
  }

  return allTiles
}

export function maskAddress(address: string) {
  const trimmedAddress = address.replace(/^0x0+/, '0x')
  return trimmedAddress.substring(0, 61)
}
