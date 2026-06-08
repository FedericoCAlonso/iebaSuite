import { describe, it, expect } from 'vitest'
import { deepCleanUndefined } from './utils'

describe('deepCleanUndefined', () => {
  it('should return primitive values unchanged', () => {
    expect(deepCleanUndefined(42)).toBe(42)
    expect(deepCleanUndefined('hello')).toBe('hello')
    expect(deepCleanUndefined(true)).toBe(true)
    expect(deepCleanUndefined(null)).toBe(null)
  })

  it('should preserve Date instances', () => {
    const date = new Date()
    expect(deepCleanUndefined(date)).toBe(date)
  })

  it('should remove undefined fields from objects', () => {
    const input = {
      a: 1,
      b: undefined,
      c: 'test'
    }
    const expected = {
      a: 1,
      c: 'test'
    }
    expect(deepCleanUndefined(input)).toEqual(expected)
  })

  it('should remove undefined elements from arrays and clean active elements', () => {
    const input = [1, undefined, { x: 2, y: undefined }, 3]
    const expected = [1, { x: 2 }, 3]
    expect(deepCleanUndefined(input)).toEqual(expected)
  })

  it('should clean nested objects recursively', () => {
    const input = {
      user: {
        name: 'John',
        age: undefined,
        address: {
          city: 'New York',
          zip: undefined
        }
      },
      tags: [ 'admin', undefined ]
    }
    const expected = {
      user: {
        name: 'John',
        address: {
          city: 'New York'
        }
      },
      tags: [ 'admin' ]
    }
    expect(deepCleanUndefined(input)).toEqual(expected)
  })

  it('should handle empty objects and arrays', () => {
    expect(deepCleanUndefined({})).toEqual({})
    expect(deepCleanUndefined([])).toEqual([])
  })
})
