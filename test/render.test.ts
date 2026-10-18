import { describe, expect, it, vi } from 'vitest'
import { mergeOptions } from '../src/render.ts'

describe('mergeOptions', () => {
  it('lets later sources win and skips empty ones', () => {
    expect(mergeOptions({ fontSize: 14, zoom: false }, undefined, null, { fontSize: 18 })).toEqual({ fontSize: 18, zoom: false })
  })

  it('calls the onRender and onError callbacks from every source', () => {
    const first = vi.fn()
    const second = vi.fn()
    const merged = mergeOptions({ onRender: first, onError: first }, { onRender: second })
    merged.onRender?.({} as never)
    merged.onError?.('boom')
    expect(first).toHaveBeenCalledTimes(2)
    expect(second).toHaveBeenCalledTimes(1)
  })
})
