import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ShowRecommendations from '@/components/ShowRecommendations.vue'
import ShowCard from '@/components/ShowCard.vue'
import router from '@/router'
import { useShowsStore } from '@/store/shows'
import type { Show, ShowsByGenre } from '@/types/show'

function buildShow(id: number, genres: string[], rating: number | null = 7): Show {
  return {
    id,
    url: `https://www.tvmaze.com/shows/${id}`,
    name: `Show ${id}`,
    genres,
    rating,
    image: null,
  }
}

function mountShowRecommendations(show: Show, storedShows: ShowsByGenre) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useShowsStore().shows = storedShows

  return mount(ShowRecommendations, { props: { show }, global: { plugins: [pinia, router] } })
}

function recommendedShowIds(wrapper: ReturnType<typeof mountShowRecommendations>): number[] {
  return wrapper.findAllComponents(ShowCard).map((showCard) => showCard.props('show').id)
}

describe('ShowRecommendations', () => {
  const currentShow = buildShow(1, ['Drama', 'Crime'])

  it('renders the list titled "Recommended for you"', () => {
    const wrapper = mountShowRecommendations(currentShow, { Drama: [buildShow(2, ['Drama'])] })

    expect(wrapper.get('h2').text()).toBe('Recommended for you')
  })

  it('recommends stored shows of the same genres', () => {
    const wrapper = mountShowRecommendations(currentShow, {
      Drama: [buildShow(2, ['Drama'])],
      Crime: [buildShow(3, ['Crime'])],
      Comedy: [buildShow(4, ['Comedy'])],
    })

    expect(recommendedShowIds(wrapper).sort()).toEqual([2, 3])
  })

  it('does not recommend the show itself', () => {
    const wrapper = mountShowRecommendations(currentShow, {
      Drama: [currentShow, buildShow(2, ['Drama'])],
    })

    expect(recommendedShowIds(wrapper)).toEqual([2])
  })

  it('recommends a show stored under several of the genres only once', () => {
    const sharedShow = buildShow(2, ['Drama', 'Crime'])

    const wrapper = mountShowRecommendations(currentShow, { Drama: [sharedShow], Crime: [sharedShow] })

    expect(recommendedShowIds(wrapper)).toEqual([2])
  })

  it('recommends at most six shows', () => {
    const dramaShows = Array.from({ length: 10 }, (_, index) => buildShow(index + 2, ['Drama']))

    const wrapper = mountShowRecommendations(currentShow, { Drama: dramaShows })

    expect(recommendedShowIds(wrapper)).toHaveLength(6)
  })

  it('recommends the top rated shows across all the genres, highest first', () => {
    const wrapper = mountShowRecommendations(currentShow, {
      Drama: [2, 3, 4, 5, 6, 7].map((id) => buildShow(id, ['Drama'], id)),
      Crime: [buildShow(8, ['Crime'], 9.5), buildShow(9, ['Crime'], null)],
    })

    expect(recommendedShowIds(wrapper)).toEqual([8, 7, 6, 5, 4, 3])
  })

  describe('when there is nothing to recommend', () => {
    it.each<[string, Show, ShowsByGenre]>([
      ['no stored shows share its genres', currentShow, { Comedy: [buildShow(2, ['Comedy'])] }],
      ['the show has no genres', buildShow(1, []), { Drama: [buildShow(2, ['Drama'])] }],
      ['the store is still empty', currentShow, {}],
    ])('renders nothing when %s', (_description, show, storedShows) => {
      const wrapper = mountShowRecommendations(show, storedShows)

      expect(wrapper.find('section').exists()).toBe(false)
    })
  })
})
