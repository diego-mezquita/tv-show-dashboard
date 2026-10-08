import { describe, expect, it } from 'vitest'
import router from '@/router'

// Navigates to the URL and returns the props its route passes to the view
async function routePropsFor(path: string) {
  await router.push(path)
  const route = router.currentRoute.value
  const props = route.matched[0]?.props.default

  return typeof props === 'function' ? props(route) : props
}

describe('router', () => {
  it.each(['/unknown', '/shows/not-a-number', '/search/extra'])('resolves %s to the not found page', (path) => {
    expect(router.resolve(path).name).toBe('not-found')
  })

  it('passes the show id from the URL as a number', async () => {
    expect(await routePropsFor('/shows/42')).toEqual({ showId: 42 })
  })

  it('passes the search query from the URL', async () => {
    expect(await routePropsFor('/search?q=breaking%20bad')).toEqual({ query: 'breaking bad' })
  })

  it.each(['/search', '/search?q=one&q=two'])('passes an empty search query for %s', async (path) => {
    expect(await routePropsFor(path)).toEqual({ query: '' })
  })
})
