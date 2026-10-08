import { onWatcherCleanup, ref, shallowRef, watch, type Ref } from 'vue'

interface LatestRequestState<Result> {
  data: Ref<Result | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
}

/**
 * Runs `request` with the value of `source` immediately and whenever it changes.
 * Responses can arrive out of order, so only the most recent request may update the state.
 */
export function useLatestRequest<Input, Result>(
  source: () => Input,
  request: (input: Input) => Promise<Result>,
): LatestRequestState<Result> {
  // Shallow because results are always replaced as a whole, never mutated
  const data = shallowRef<Result | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function run(input: Input): Promise<void> {
    let isOutdated = false

    // Runs right before the next request and when the watcher stops (e.g. on unmount).
    // Must be registered before the first await: Vue only knows the active watcher synchronously
    onWatcherCleanup(() => {
      isOutdated = true
    })

    data.value = null
    error.value = null
    isLoading.value = true

    try {
      const result = await request(input)

      if (!isOutdated) {
        data.value = result
      }
    } catch (caughtError) {
      if (!isOutdated) {
        error.value = (caughtError as Error).message
      }
    } finally {
      if (!isOutdated) {
        isLoading.value = false
      }
    }
  }

  watch(source, run, { immediate: true })

  return { data, isLoading, error }
}
