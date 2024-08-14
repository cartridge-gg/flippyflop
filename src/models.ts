import { BigNumberish } from 'starknet'

// Dojo Model representation
export interface Tile {
  x: number
  y: number
  flipped: BigNumberish
}

// Helper model
export interface Chunk {
  x: number
  y: number
  worldX: number
  worldY: number
  tiles: Tile[]
}
