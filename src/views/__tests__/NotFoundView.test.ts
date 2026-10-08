import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NotFoundView from '@/views/NotFoundView.vue'

describe('NotFoundView', () => {
  it('renders the not found message as the page heading', () => {
    const wrapper = mount(NotFoundView)

    expect(wrapper.get('h1').text()).toBe("Nothing on this channel. We couldn't find the page you're looking for.")
  })
})
