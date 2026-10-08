import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent } from 'vue'
import AppHeader from '@/components/AppHeader.vue'

const EmptyView = defineComponent({ render: () => null })

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: EmptyView },
      { path: '/search', name: 'search', component: EmptyView },
      { path: '/shows/:id', name: 'show-detail', component: EmptyView },
    ],
  })
}

async function mountAppHeaderAt(path: string) {
  const router = createTestRouter()

  router.push(path)

  await router.isReady()

  const wrapper = mount(AppHeader, { global: { plugins: [router] } })

  return { wrapper, router }
}

async function submitSearch(wrapper: Awaited<ReturnType<typeof mountAppHeaderAt>>['wrapper'], text: string) {
  await wrapper.get('input').setValue(text)
  await wrapper.get('form').trigger('submit')

  await flushPromises()
}

// Memory history navigates asynchronously on back/forward
async function goBack(router: Router) {
  const navigated = new Promise<void>((resolve) => {
    const removeHook = router.afterEach(() => {
      removeHook()
      resolve()
    })
  })
  router.back()
  await navigated
  await flushPromises()
}

describe('AppHeader', () => {
  it('renders a link to the home page', async () => {
    const { wrapper } = await mountAppHeaderAt('/search?q=dome')

    expect(wrapper.get('a').attributes('href')).toBe('/')
  })

  describe('searching', () => {
    it('navigates to the search results for the submitted query', async () => {
      const { wrapper, router } = await mountAppHeaderAt('/')

      await submitSearch(wrapper, 'breaking bad')

      expect(router.currentRoute.value.name).toBe('search')
      expect(router.currentRoute.value.query).toEqual({ q: 'breaking bad' })
    })

    it('does not navigate when the query is empty', async () => {
      const { wrapper, router } = await mountAppHeaderAt('/')

      await submitSearch(wrapper, '   ')

      expect(router.currentRoute.value.name).toBe('home')
    })
  })

  describe('search field text', () => {
    it('shows the query of the search results being displayed', async () => {
      const { wrapper } = await mountAppHeaderAt('/search?q=breaking%20bad')

      expect(wrapper.get('input').element.value).toBe('breaking bad')
    })

    it.each(['/shows/1?q=ignored', '/search', '/search?q=one&q=two'])('is empty on %s', async (path) => {
      const { wrapper } = await mountAppHeaderAt(path)

      expect(wrapper.get('input').element.value).toBe('')
    })

    it('shows the previous query when navigating back', async () => {
      const { wrapper, router } = await mountAppHeaderAt('/search?q=breaking%20bad')
      await router.push({ name: 'search', query: { q: 'the wire' } })

      await goBack(router)

      expect(wrapper.get('input').element.value).toBe('breaking bad')
    })

    it('is cleared when navigating back to a page without search', async () => {
      const { wrapper, router } = await mountAppHeaderAt('/')

      await submitSearch(wrapper, 'breaking bad')

      await goBack(router)

      expect(wrapper.get('input').element.value).toBe('')
    })
  })
})
