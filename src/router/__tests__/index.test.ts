import { describe, expect, it } from 'vitest'
import router from '@/router'

describe('router', () => {
  it.each(['/unknown', '/shows/not-a-number', '/search/extra'])('resolves %s to the not found page', (path) => {
    expect(router.resolve(path).name).toBe('not-found')
  })
})
