import { CHUNK_SIZE, CHUNKS, CHUNKS_PER_DIMENSION, TILE_MODEL_TAG } from './constants'
import { Powerup } from './models'
import { poseidonHash } from '@/libs/dojo.c/dojo_c'

import type { Tile } from './models'
import type { ToriiClient } from '@/libs/dojo.c/dojo_c'

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
  // language=graphql
  const query = `query {
    accounts(where:{
      contractAddress: \"${address}\"
    }) {
      edges {
        node {
          id
        }
      }
    }
  }`
  const data = (await (
    await fetch('https://api.cartridge.gg/query', {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
      method: 'POST',
    })
  ).json()) as {
    data: {
      accounts: {
        edges:
          | {
              node: {
                id: string
              } | null
            }[]
          | null
      } | null
    }
  }

  return data.data.accounts.edges?.[0]?.node?.id
}

export async function fetchUsernames(addresses: string[]) {
  const input = addresses.map((address) => `{ addressHasPrefix: "${address}" }`).join(',')
  // language=graphql
  const query = `query {
    accounts(where: {
      hasControllersWith: {
        or: [${input}]
      }
    }) {
      edges {
        node {
          id
          controllers {
            edges {
              node {
                id
                address
              }
            }
          }
        }
      }
    }
  }`
  const data = (await (
    await fetch('https://api.cartridge.gg/query', {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
      method: 'POST',
    })
  ).json()) as {
    data: {
      accounts: {
        edges:
          | {
              node: {
                id: string
                controllers: {
                  edges: {
                    node: {
                      id: string
                      address: string
                    } | null
                  }[]
                }
              } | null
            }[]
          | null
      } | null
    }
  }

  return data.data.accounts.edges.reduce((acc, account) => {
    for (const controller of account?.node?.controllers.edges || []) {
      acc[controller.node.address] = account.node.id
      acc[maskAddress(controller.node.address)] = account.node.id
    }
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
  const address = packedFlipped !== '0x0' ? maskAddress(packedFlipped) : '0x0'
  const powerup =
    address !== '0x0'
      ? parseInt(packedFlipped.substring(packedFlipped.length - 4, packedFlipped.length - 3), 16)
      : Powerup.None
  const powerupValue =
    address !== '0x0' ? parseInt(packedFlipped.substring(packedFlipped.length - 3, packedFlipped.length - 1), 16) : 0
  const team =
    address !== '0x0' ? parseInt(packedFlipped.substring(packedFlipped.length - 1, packedFlipped.length), 16) : 0

  return {
    x: model.x.value,
    y: model.y.value,
    address: address,
    powerup: powerup,
    powerupValue: powerupValue,
    team: team,
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
  updateTiles?: (tiles: Record<string, Tile>) => void,
): Promise<Record<string, Tile>> {
  let allTiles: Record<string, Tile> = {}
  let cursor = 0
  let hasMore = true
  const size = 100000

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
      dont_include_hashed_keys: true,
    })

    const fetchedTiles = Object.values(entities).reduce(
      (acc, entity) => {
        if (!entity[TILE_MODEL_TAG]) {
          return acc
        }

        const tile = parseTileModel(entity[TILE_MODEL_TAG])
        acc[`${tile.x},${tile.y}`] = tile
        return acc
      },
      {} as Record<string, Tile>,
    )

    allTiles = { ...allTiles, ...fetchedTiles }

    if (updateTiles) {
      updateTiles(fetchedTiles)
    }

    const fetchedCount = Object.keys(entities).length
    cursor += fetchedCount
    hasMore = fetchedCount === size
  }

  return allTiles
}

export function maskAddress(address: string) {
  return address.substring(0, address.length - 4)
}

export function calculatePowerup(
  x: number,
  y: number,
  txHash: string,
): {
  powerup: Powerup
  powerupValue: number
} {
  const seed = poseidonHash([x.toString(), y.toString()])
  const hash = poseidonHash([seed, txHash])
  const randomValue = BigInt(hash) % BigInt(1000000)

  if (randomValue < BigInt(calculateCumulativeProbability(Powerup.Multiplier, 32))) {
    return { powerup: Powerup.Multiplier, powerupValue: 32 }
  } else if (randomValue < BigInt(calculateCumulativeProbability(Powerup.Multiplier, 16))) {
    return { powerup: Powerup.Multiplier, powerupValue: 16 }
  } else if (randomValue < BigInt(calculateCumulativeProbability(Powerup.Multiplier, 8))) {
    return { powerup: Powerup.Multiplier, powerupValue: 8 }
  } else if (randomValue < BigInt(calculateCumulativeProbability(Powerup.Multiplier, 4))) {
    return { powerup: Powerup.Multiplier, powerupValue: 4 }
  } else if (randomValue < BigInt(calculateCumulativeProbability(Powerup.Multiplier, 2))) {
    return { powerup: Powerup.Multiplier, powerupValue: 2 }
  } else {
    return { powerup: Powerup.None, powerupValue: 0 }
  }
}

export function calculateCumulativeProbability(powerup: Powerup, powerupValue: number) {
  switch (powerup) {
    case Powerup.None:
      return 1000000 // 100%
    case Powerup.Multiplier:
      switch (powerupValue) {
        case 2:
          return 50500 // 5%
        case 4:
          return 500 // 0.05%
        case 8:
          return 100 // 0.01%
        case 16:
          return 50 // 0.0050%
        case 32:
          return 15 // 0.0015%
        default:
          return 0
      }
  }
}

export function calculateLocalTilePos(chunkWorldX: number, chunkWorldY: number, worldX: number, worldY: number) {
  return [Math.floor((worldX - chunkWorldX - 0.5) / 1.1), Math.floor((worldY - chunkWorldY - 0.5) / 1.1)]
}

export function formatE(value: bigint) {
  return value / BigInt(10 ** 18)
}

export function parseError(error: any) {
  if (error.message !== 'Transaction execution error') return error.message

  if (error.data.execution_error.includes('Game must not be locked')) return 'Game has not started yet or has ended.'
  if (error.data.execution_error.includes('Tile already flipped')) return 'Tile already flipped.'
  if (error.data.execution_error.includes('X is out of bounds')) return 'Tile is out of bounds.'
  if (error.data.execution_error.includes('Y is out of bounds')) return 'Tile is out of bounds.'
  if (error.data.execution_error.includes('Game must be locked')) return 'Game has not ended yet.'
  if (error.data.execution_error.includes('Claim already processed')) return 'Claim already processed.'
  return error.message
}
