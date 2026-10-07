import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ShowCard from '@/components/ShowCard.vue'
import type { Show } from '@/types/show'

function buildShow(overrides: Partial<Show> = {}): Show {
  return {
    id: 1,
    url: 'https://www.tvmaze.com/shows/1/under-the-dome',
    name: 'Under the Dome',
    genres: ['Drama', 'Science-Fiction'],
    rating: 6.5,
    image: 'https://static.tvmaze.com/poster.jpg',
    ...overrides,
  }
}

function mountShowCard(show: Show) {
  return mount(ShowCard, { props: { show } })
}

describe('ShowCard', () => {
  it('renders the show name', () => {
    const wrapper = mountShowCard(buildShow())

    expect(wrapper.text()).toContain('Under the Dome')
  })

  describe('poster', () => {
    it('renders the poster', () => {
      const wrapper = mountShowCard(buildShow())

      expect(wrapper.get('img').attributes('src')).toBe('https://static.tvmaze.com/poster.jpg')
    })

    it('renders a placeholder when there is no image', () => {
      const wrapper = mountShowCard(buildShow({ image: null }))

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('Not available')
    })
  })

  describe('genres', () => {
    it('renders the genres as a comma separated list', () => {
      const wrapper = mountShowCard(buildShow({ genres: ['Drama', 'Science-Fiction', 'Thriller'] }))

      expect(wrapper.text()).toContain('Drama, Science-Fiction, Thriller')
    })

    it('renders a dash when the show has no genres', () => {
      const wrapper = mountShowCard(buildShow({ genres: [] }))

      expect(wrapper.text()).toContain('—')
    })
  })

  describe('rating', () => {
    it('renders the rating', () => {
      const wrapper = mountShowCard(buildShow({ rating: 8.7 }))

      expect(wrapper.text()).toContain('Rating: 8.7')
    })

    it('renders a rating of zero', () => {
      const wrapper = mountShowCard(buildShow({ rating: 0 }))

      expect(wrapper.text()).toContain('Rating: 0')
    })

    it('does not render the rating when the show has none', () => {
      const wrapper = mountShowCard(buildShow({ rating: null }))

      expect(wrapper.text()).not.toContain('Rating:')
    })
  })
})
