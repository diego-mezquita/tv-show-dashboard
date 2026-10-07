import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ShowDetailView from '@/views/ShowDetailView.vue'
import { fetchShowById } from '@/services/tvmaze'
import type { ShowDetails } from '@/types/show'

vi.mock('@/services/tvmaze', () => ({
  fetchShowById: vi.fn(),
}))

const fetchShowByIdMock = vi.mocked(fetchShowById)

function buildShowDetails(overrides: Partial<ShowDetails> = {}): ShowDetails {
  return {
    id: 1,
    url: 'https://www.tvmaze.com/shows/1/under-the-dome',
    name: 'Under the Dome',
    genres: ['Drama', 'Thriller'],
    rating: 6.5,
    image: 'https://static.tvmaze.com/original.jpg',
    language: 'English',
    runtime: 60,
    premiered: '2013-06-24',
    ended: '2015-09-10',
    summary: 'Under the Dome is the story of a small town.',
    ...overrides,
  }
}

// Lets a test decide when, and in which order, pending requests resolve or fail
function deferredRequest() {
  let resolveRequest: (show: ShowDetails) => void = () => {}
  let rejectRequest: (error: Error) => void = () => {}
  const promise = new Promise<ShowDetails>((resolve, reject) => {
    resolveRequest = resolve
    rejectRequest = reject
  })

  return { promise, resolveRequest, rejectRequest }
}

async function mountLoadedView(show: ShowDetails) {
  fetchShowByIdMock.mockResolvedValue(show)
  const wrapper = mount(ShowDetailView, { props: { showId: show.id } })
  await flushPromises()

  return wrapper
}

// Two requests that the test resolves or fails in any order
function mountWithTwoPendingRequests() {
  const firstRequest = deferredRequest()
  const secondRequest = deferredRequest()
  fetchShowByIdMock.mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(secondRequest.promise)
  const wrapper = mount(ShowDetailView, { props: { showId: 1 } })

  return { wrapper, firstRequest, secondRequest }
}

describe('ShowDetailView', () => {
  beforeEach(() => {
    fetchShowByIdMock.mockReset()
  })

  describe('loading', () => {
    it('requests the show with the given id', async () => {
      await mountLoadedView(buildShowDetails({ id: 42 }))

      expect(fetchShowByIdMock).toHaveBeenCalledWith(42)
    })

    it('renders a loading message while the show loads', () => {
      fetchShowByIdMock.mockReturnValue(deferredRequest().promise)

      const wrapper = mount(ShowDetailView, { props: { showId: 1 } })

      expect(wrapper.text()).toContain('Loading show…')
    })

    it('removes the loading message once the show has loaded', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      expect(wrapper.text()).not.toContain('Loading show…')
    })
  })

  describe('show details', () => {
    it('renders the show name as the page heading', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      expect(wrapper.get('h1').text()).toBe('Under the Dome')
    })

    it('renders the poster', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      expect(wrapper.get('img').attributes('src')).toBe('https://static.tvmaze.com/original.jpg')
    })

    it('renders a placeholder when there is no image', async () => {
      const wrapper = await mountLoadedView(buildShowDetails({ image: null }))

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('Not available')
    })

    it('renders the genres as a list', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      expect(wrapper.findAll('li').map((genre) => genre.text())).toEqual(['Drama', 'Thriller'])
    })

    it('does not render the genres when the show has none', async () => {
      const wrapper = await mountLoadedView(buildShowDetails({ genres: [] }))

      expect(wrapper.find('ul').exists()).toBe(false)
    })

    it('renders language, runtime and dates', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      const details = wrapper.findAll('dd').map((detail) => detail.text())

      expect(details).toEqual(expect.arrayContaining(['English', '60 min', '2013-06-24', '2015-09-10']))
    })

    it('renders a dash for every missing detail', async () => {
      const wrapper = await mountLoadedView(
        buildShowDetails({ genres: [], language: null, runtime: null, premiered: null, ended: null }),
      )

      const details = wrapper.findAll('dd').map((detail) => detail.text())

      expect(details).toEqual(['—', '—', '—', '—'])
    })

    it('renders the summary', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      expect(wrapper.text()).toContain('Under the Dome is the story of a small town.')
    })

    it('does not render a summary when the show has none', async () => {
      const wrapper = await mountLoadedView(buildShowDetails({ summary: null }))

      expect(wrapper.find('p').exists()).toBe(false)
    })
  })

  describe('errors', () => {
    it('renders the error when the show fails to load', async () => {
      fetchShowByIdMock.mockRejectedValue(new Error('Show not found'))

      const wrapper = mount(ShowDetailView, { props: { showId: 999999 } })
      await flushPromises()

      expect(wrapper.text()).toBe('Failed to load the show: Show not found')
    })

    it('removes the error when another show loads successfully', async () => {
      fetchShowByIdMock.mockRejectedValueOnce(new Error('Show not found'))
      const wrapper = mount(ShowDetailView, { props: { showId: 999999 } })
      await flushPromises()

      fetchShowByIdMock.mockResolvedValue(buildShowDetails())
      await wrapper.setProps({ showId: 1 })
      await flushPromises()

      expect(wrapper.text()).not.toContain('Failed to load the show')
    })
  })

  describe('when the show id changes', () => {
    it('loads and renders the new show', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      fetchShowByIdMock.mockResolvedValue(buildShowDetails({ id: 2, name: 'The Wire' }))
      await wrapper.setProps({ showId: 2 })
      await flushPromises()

      expect(fetchShowByIdMock).toHaveBeenLastCalledWith(2)
      expect(wrapper.get('h1').text()).toBe('The Wire')
    })

    it('does not keep rendering the previous show while the new one loads', async () => {
      const wrapper = await mountLoadedView(buildShowDetails())

      fetchShowByIdMock.mockReturnValue(deferredRequest().promise)
      await wrapper.setProps({ showId: 2 })

      expect(wrapper.find('h1').exists()).toBe(false)
    })

    it('ignores the response of an outdated request that arrives last', async () => {
      const { wrapper, firstRequest, secondRequest } = mountWithTwoPendingRequests()
      await wrapper.setProps({ showId: 2 })

      secondRequest.resolveRequest(buildShowDetails({ id: 2, name: 'The Wire' }))
      await flushPromises()
      firstRequest.resolveRequest(buildShowDetails())
      await flushPromises()

      expect(wrapper.get('h1').text()).toBe('The Wire')
    })

    it('ignores the error of an outdated request that arrives last', async () => {
      const { wrapper, firstRequest, secondRequest } = mountWithTwoPendingRequests()
      await wrapper.setProps({ showId: 2 })

      secondRequest.resolveRequest(buildShowDetails({ id: 2, name: 'The Wire' }))
      await flushPromises()
      firstRequest.rejectRequest(new Error('HTTP error 500'))
      await flushPromises()

      expect(wrapper.text()).not.toContain('Failed to load the show')
    })

    it('keeps loading while the latest request is pending, even if an outdated one finishes', async () => {
      const { wrapper, firstRequest } = mountWithTwoPendingRequests()
      await wrapper.setProps({ showId: 2 })

      firstRequest.resolveRequest(buildShowDetails())
      await flushPromises()

      expect(wrapper.text()).toBe('Loading show…')
    })
  })
})
