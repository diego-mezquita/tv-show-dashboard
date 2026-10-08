import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HorizontalShowList from '@/components/HorizontalShowList.vue'
import ShowCard from '@/components/ShowCard.vue'
import router from '@/router'
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

function mountHorizontalShowList(title: string, shows: Show[]) {
  return mount(HorizontalShowList, { props: { title, shows }, global: { plugins: [router] } })
}

describe('HorizontalShowList', () => {
  it('renders the title as a level 2 heading', () => {
    const wrapper = mountHorizontalShowList('Drama', dramaShows)

    expect(wrapper.get('h2').text()).toBe('Drama')
  })

  describe('shows', () => {
    it('renders a list of ShowCards', () => {
      const wrapper = mountHorizontalShowList('Drama', dramaShows)

      const list = wrapper.get('ul')
      const showCards = list.findAllComponents(ShowCard)

      expect(showCards).toHaveLength(dramaShows.length)
    })

    it('renders the shows in the given order', () => {
      const wrapper = mountHorizontalShowList('Drama', dramaShows)

      const listItems = wrapper.findAll('ul > li')

      expect(listItems.map((listItem) => listItem.text())).toEqual([
        expect.stringContaining('Breaking Bad'),
        expect.stringContaining('The Wire'),
        expect.stringContaining('Mad Men'),
      ])
    })

    it('renders an empty list when there are no shows', () => {
      const wrapper = mountHorizontalShowList('Drama', [])

      expect(wrapper.get('ul').findAll('li')).toHaveLength(0)
    })
  })
})
