import { Ty, Model } from 'dojo.c/pkg'

export function parseModel<T>(model: Model): T {
  let result = {} as T
  for (const key in model) {
    result[key] = model[key].value
  }

  return result
}
