// Dojo Model representation
export enum Powerup {
  None,
  Lock,
  Multiplier,
}

export interface Tile {
  x: number
  y: number
  address: string
  powerup: Powerup
  powerupValue: number
}

// Helper model
export interface Chunk {
  x: number
  y: number
  worldX: number
  worldY: number
  tiles: Tile[]
}
