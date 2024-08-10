import { Ty, Model } from 'dojo.c/pkg'
import { CHUNK_SIZE } from './constants'
import { Tile } from './models'

export function parseModel<T>(model: Model): T {
  let result = {} as T
  for (const key in model) {
    result[key] = model[key].value
  }

  return result
}

export function initializeTiles(x: number, y: number, width = CHUNK_SIZE, height = CHUNK_SIZE) {
  const tiles = []
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      tiles.push({ x: x + i, y: y + j, flipped: '0x0' } as Tile)
    }
  }

  return tiles
}
