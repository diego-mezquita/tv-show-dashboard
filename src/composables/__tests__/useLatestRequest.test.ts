import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createApp, nextTick, ref } from 'vue'
import { useLatestRequest } from '@/composables/useLatestRequest'

// Lets a test decide when, and in which order, pending requests resolve or fail
function deferredRequest() {
  let resolveRequest: (result: string) => void = () => {}
  let rejectRequest: (error: Error) => void = () => {}
  const promise = new Promise<string>((resolve, reject) => {
    resolveRequest = resolve
    rejectRequest = reject
  })

  return { promise, resolveRequest, rejectRequest }
}

// Runs a composable inside a host component, as recommended by the Vue docs for testing composables
function withSetup<Result>(composable: () => Result) {
  let result!: Result
  const app = createApp({
    setup() {
      result = composable()

      return () => {}
    },
  })
  app.mount(document.createElement('div'))

  return { result, app }
}

function useLatestRequestWith(request: (input: string) => Promise<string>, initialInput = 'first') {
  const input = ref(initialInput)
  const { result, app } = withSetup(() => useLatestRequest(() => input.value, request))

  return { input, app, ...result }
}

describe('useLatestRequest', () => {
  it('runs the request immediately with the source value', async () => {
    const request = vi.fn().mockResolvedValue('first result')

    const { data } = useLatestRequestWith(request)
    await flushPromises()

    expect(request).toHaveBeenCalledWith('first')
    expect(data.value).toBe('first result')
  })

  it('is loading while the request is pending', async () => {
    const pendingRequest = deferredRequest()

    const { isLoading } = useLatestRequestWith(() => pendingRequest.promise)

    expect(isLoading.value).toBe(true)

    pendingRequest.resolveRequest('first result')
    await flushPromises()

    expect(isLoading.value).toBe(false)
  })

  it('exposes the error message when the request fails', async () => {
    const { data, error } = useLatestRequestWith(() => Promise.reject(new Error('Network down')))
    await flushPromises()

    expect(error.value).toBe('Network down')
    expect(data.value).toBeNull()
  })

  it('ignores a response that arrives after the component unmounts', async () => {
    const pendingRequest = deferredRequest()
    const { app, data } = useLatestRequestWith(() => pendingRequest.promise)

    app.unmount()
    pendingRequest.resolveRequest('first result')
    await flushPromises()

    expect(data.value).toBeNull()
  })

  describe('when the source changes', () => {
    it('runs the request again with the new value', async () => {
      const request = vi.fn((input: string) => Promise.resolve(`${input} result`))
      const { input, data } = useLatestRequestWith(request)
      await flushPromises()

      input.value = 'second'
      await flushPromises()

      expect(request).toHaveBeenLastCalledWith('second')
      expect(data.value).toBe('second result')
    })

    it('clears the previous result and error while the new request loads', async () => {
      const request = vi
        .fn<(input: string) => Promise<string>>()
        .mockRejectedValueOnce(new Error('Network down'))
        .mockReturnValueOnce(deferredRequest().promise)
      const { input, data, error } = useLatestRequestWith(request)
      await flushPromises()

      input.value = 'second'
      await nextTick()

      expect(error.value).toBeNull()
      expect(data.value).toBeNull()
    })

    it('ignores the response of an outdated request that arrives last', async () => {
      const firstRequest = deferredRequest()
      const secondRequest = deferredRequest()
      const request = vi
        .fn<(input: string) => Promise<string>>()
        .mockReturnValueOnce(firstRequest.promise)
        .mockReturnValueOnce(secondRequest.promise)
      const { input, data } = useLatestRequestWith(request)
      input.value = 'second'
      await nextTick()

      secondRequest.resolveRequest('second result')
      await flushPromises()
      firstRequest.resolveRequest('first result')
      await flushPromises()

      expect(data.value).toBe('second result')
    })

    it('ignores the error of an outdated request that arrives last', async () => {
      const firstRequest = deferredRequest()
      const secondRequest = deferredRequest()
      const request = vi
        .fn<(input: string) => Promise<string>>()
        .mockReturnValueOnce(firstRequest.promise)
        .mockReturnValueOnce(secondRequest.promise)
      const { input, error } = useLatestRequestWith(request)
      input.value = 'second'
      await nextTick()

      secondRequest.resolveRequest('second result')
      await flushPromises()
      firstRequest.rejectRequest(new Error('Network down'))
      await flushPromises()

      expect(error.value).toBeNull()
    })

    it('keeps loading while the latest request is pending, even if an outdated one finishes', async () => {
      const firstRequest = deferredRequest()
      const request = vi
        .fn<(input: string) => Promise<string>>()
        .mockReturnValueOnce(firstRequest.promise)
        .mockReturnValueOnce(deferredRequest().promise)
      const { input, isLoading } = useLatestRequestWith(request)
      input.value = 'second'
      await nextTick()

      firstRequest.resolveRequest('first result')
      await flushPromises()

      expect(isLoading.value).toBe(true)
    })
  })
})
