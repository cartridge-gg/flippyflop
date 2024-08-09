import { BigNumberish } from 'starknet'

export interface Tile {
  x: number
  y: number
  flipped: BigNumberish
}
