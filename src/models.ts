// Dojo Model representation
export enum Powerup {
  None,
  Multiplier,
}

export interface Tile {
  x: number
  y: number
  address: string
  powerup: Powerup
  powerupValue: number
  team: number
}

// Helper model
export interface Chunk {
  x: number
  y: number
  worldX: number
  worldY: number
  tiles: Tile[]
}

export interface Game {
  startsAt: number
  endsAt: number
}
