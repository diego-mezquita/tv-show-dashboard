import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GenreList from '@/components/GenreList.vue'
import ShowCard from '@/components/ShowCard.vue'
import type { Show } from '@/types/show'

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

const dramaShows = [buildShow(1, 'Breaking Bad'), buildShow(2, 'The Wire'), buildShow(3, 'Mad Men')]

function mountGenreList(genre: string, shows: Show[]) {
  return mount(GenreList, { props: { genre, shows } })
}

describe('GenreList', () => {
  it('renders the genre as a level 2 heading', () => {
    const wrapper = mountGenreList('Drama', dramaShows)

    expect(wrapper.get('h2').text()).toBe('Drama')
  })

  describe('shows', () => {
    it('renders a list of ShowCards of that genre', () => {
      const wrapper = mountGenreList('Drama', dramaShows)

      const list = wrapper.get('ul')
      const showCards = list.findAllComponents(ShowCard)

      expect(showCards).toHaveLength(dramaShows.length)
    })

    it('renders the shows in the given order', () => {
      const wrapper = mountGenreList('Drama', dramaShows)

      const listItems = wrapper.findAll('ul > li')

      expect(listItems.map((listItem) => listItem.text())).toEqual([
        expect.stringContaining('Breaking Bad'),
        expect.stringContaining('The Wire'),
        expect.stringContaining('Mad Men'),
      ])
    })

    it('renders an empty list when there are no shows', () => {
      const wrapper = mountGenreList('Drama', [])

      expect(wrapper.get('ul').findAll('li')).toHaveLength(0)
    })
  })
})
