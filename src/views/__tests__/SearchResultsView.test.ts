import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import SearchResultsView from '@/views/SearchResultsView.vue'
import ShowCard from '@/components/ShowCard.vue'
import router from '@/router'
import { searchShows } from '@/services/tvmaze'
import type { Show } from '@/types/show'

vi.mock('@/services/tvmaze', () => ({
  searchShows: vi.fn(),
}))

const searchShowsMock = vi.mocked(searchShows)

function buildShow(id: number, name: string): Show {
  return {
    id,
    url: `https://www.tvmaze.com/shows/${id}`,
    name,
    genres: ['Drama'],
    rating: 7,
    image: null,
  }
}

function mountSearchResultsView(query: string) {
  return mount(SearchResultsView, { props: { query }, global: { plugins: [router] } })
}

async function mountSearchedView(query: string, results: Show[]) {
  searchShowsMock.mockResolvedValue(results)
  const wrapper = mountSearchResultsView(query)
  await flushPromises()

  return wrapper
}

describe('SearchResultsView', () => {
  beforeEach(() => {
    searchShowsMock.mockReset()
  })

  it('searches shows with the given query', async () => {
    await mountSearchedView('breaking bad', [])

    expect(searchShowsMock).toHaveBeenCalledWith('breaking bad')
  })

  it('searches with the query without surrounding whitespace', async () => {
    await mountSearchedView('  breaking bad ', [])

    expect(searchShowsMock).toHaveBeenCalledWith('breaking bad')
  })

  it('renders a searching message while searching', () => {
    searchShowsMock.mockReturnValue(new Promise(() => {}))

    const wrapper = mountSearchResultsView('breaking bad')

    expect(wrapper.text()).toBe('Searching…')
  })

  it('renders a list of ShowCards of the results', async () => {
    const results = [buildShow(1, 'Breaking Bad'), buildShow(2, 'Better Call Saul')]

    const wrapper = await mountSearchedView('breaking', results)

    const showCards = wrapper.get('ul').findAllComponents(ShowCard)

    expect(showCards).toHaveLength(results.length)
  })

  it('renders a message when nothing matches the query', async () => {
    const wrapper = await mountSearchedView('nothing matches this', [])

    expect(wrapper.text()).toBe('No results for "nothing matches this"')
  })

  it('renders the error when the search fails', async () => {
    searchShowsMock.mockRejectedValue(new Error('HTTP error 500'))

    const wrapper = mountSearchResultsView('breaking bad')
    await flushPromises()

    expect(wrapper.text()).toBe('Failed to search shows: HTTP error 500')
  })

  describe('blank query', () => {
    it.each(['', '   '])('does not search (%j)', async (query) => {
      await mountSearchedView(query, [])

      expect(searchShowsMock).not.toHaveBeenCalled()
    })

    it('asks the user to type a show name', async () => {
      const wrapper = await mountSearchedView('', [])

      expect(wrapper.text()).toBe('Type a show name to search')
    })
  })

  it('searches again when the query changes', async () => {
    const wrapper = await mountSearchedView('breaking bad', [])

    searchShowsMock.mockResolvedValue([buildShow(3, 'The Wire')])
    await wrapper.setProps({ query: 'the wire' })
    await flushPromises()

    expect(searchShowsMock).toHaveBeenLastCalledWith('the wire')
    expect(wrapper.text()).toContain('The Wire')
  })
})
