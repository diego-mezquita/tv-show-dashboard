import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchField from '@/components/SearchField.vue'

function mountSearchField(query?: string) {
  return mount(SearchField, { props: { query } })
}

async function submitSearch(wrapper: ReturnType<typeof mountSearchField>, text: string) {
  await wrapper.get('input').setValue(text)
  await wrapper.get('form').trigger('submit')
}

describe('SearchField', () => {
  describe('query', () => {
    it('starts empty when no query is given', () => {
      const wrapper = mountSearchField()

      expect(wrapper.get('input').element.value).toBe('')
    })

    it('shows the given query', () => {
      const wrapper = mountSearchField('breaking bad')

      expect(wrapper.get('input').element.value).toBe('breaking bad')
    })

    it('follows the query when it changes', async () => {
      const wrapper = mountSearchField('breaking bad')

      await wrapper.setProps({ query: 'the wire' })

      expect(wrapper.get('input').element.value).toBe('the wire')
    })
  })

  describe('submitting', () => {
    it('emits the search with the typed query', async () => {
      const wrapper = mountSearchField()

      await submitSearch(wrapper, 'breaking bad')

      expect(wrapper.emitted('search')).toEqual([['breaking bad']])
    })

    it('emits the query without surrounding whitespace', async () => {
      const wrapper = mountSearchField()

      await submitSearch(wrapper, '   breaking bad  ')

      expect(wrapper.emitted('search')).toEqual([['breaking bad']])
    })

    it('keeps the query, without surrounding whitespace, in the input after submitting', async () => {
      const wrapper = mountSearchField()

      await submitSearch(wrapper, '  breaking bad ')

      expect(wrapper.get('input').element.value).toBe('breaking bad')
    })

    it.each(['', '    '])('does not emit an empty search (%j)', async (text) => {
      const wrapper = mountSearchField()

      await submitSearch(wrapper, text)

      expect(wrapper.emitted('search')).toBeUndefined()
    })
  })
})
