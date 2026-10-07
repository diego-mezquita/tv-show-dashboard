import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useShowsStore } from '@/store/shows'
import { fetchShows } from '@/services/tvmaze'
import type { TvMazeShow } from '@/types/show'

vi.mock('@/services/tvmaze', () => ({
  fetchShows: vi.fn(),
}))

const fetchShowsMock = vi.mocked(fetchShows)

function buildTvMazeShow(id: number, rating: number | null, genres: string[] = ['Drama']): TvMazeShow {
  return {
    id,
    url: `https://www.tvmaze.com/shows/${id}`,
    name: `Show ${id}`,
    genres,
    rating: { average: rating },
    image: {
      medium: `https://static.tvmaze.com/${id}/medium.jpg`,
      original: `https://static.tvmaze.com/${id}/original.jpg`,
    },
  }
}

function respondWithBatches(...batches: TvMazeShow[][]) {
  fetchShowsMock.mockImplementation(async (_pagesToFetch, onBatch) => {
    batches.forEach((batch) => onBatch(batch))
  })
}

function showIdsOf(genre: string): number[] | undefined {
  return useShowsStore().shows[genre]?.map((show) => show.id)
}

describe('shows store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchShowsMock.mockReset()
  })

  it('starts empty, not loading and without errors', () => {
    const store = useShowsStore()

    expect(store.shows).toEqual({})
    expect(store.isLoading).toBe(false)
    expect(store.isInitialLoaded).toBe(false)
    expect(store.error).toBeNull()
  })

  describe('grouping by genre', () => {
    it('groups the shows by genre', async () => {
      respondWithBatches([
        buildTvMazeShow(1, 8, ['Drama']),
        buildTvMazeShow(2, 7, ['Comedy']),
        buildTvMazeShow(3, 6, ['Drama']),
      ])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).toEqual([1, 3])
      expect(showIdsOf('Comedy')).toEqual([2])
    })

    it('adds a show to every one of its genres', async () => {
      respondWithBatches([buildTvMazeShow(1, 8, ['Drama', 'Crime', 'Thriller'])])

      await useShowsStore().loadShows()

      expect(useShowsStore().shows).toEqual({
        Drama: [expect.objectContaining({ id: 1 })],
        Crime: [expect.objectContaining({ id: 1 })],
        Thriller: [expect.objectContaining({ id: 1 })],
      })
    })

    it('leaves out shows without genres', async () => {
      respondWithBatches([buildTvMazeShow(1, 8, [])])

      await useShowsStore().loadShows()

      expect(useShowsStore().shows).toEqual({})
    })

    it('combines the shows of several batches', async () => {
      respondWithBatches([buildTvMazeShow(1, 6)], [buildTvMazeShow(2, 9)])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).toEqual([2, 1])
    })

    it('maps each show to the app model', async () => {
      respondWithBatches([buildTvMazeShow(1, 8.5, ['Drama'])])

      await useShowsStore().loadShows()

      expect(useShowsStore().shows.Drama).toEqual([
        {
          id: 1,
          url: 'https://www.tvmaze.com/shows/1',
          name: 'Show 1',
          genres: ['Drama'],
          rating: 8.5,
          image: 'https://static.tvmaze.com/1/medium.jpg',
        },
      ])
    })

    it('maps a missing image to null', async () => {
      respondWithBatches([{ ...buildTvMazeShow(1, 8), image: null }])

      await useShowsStore().loadShows()

      expect(useShowsStore().shows.Drama?.[0]?.image).toBeNull()
    })
  })

  describe('sorting by rating', () => {
    it('sorts the shows of each genre by rating, highest first', async () => {
      respondWithBatches([buildTvMazeShow(1, 6), buildTvMazeShow(2, 9), buildTvMazeShow(3, 7.5)])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).toEqual([2, 3, 1])
    })

    it('places shows without rating last', async () => {
      respondWithBatches([buildTvMazeShow(1, null), buildTvMazeShow(2, 5), buildTvMazeShow(3, 9)])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).toEqual([3, 2, 1])
    })
  })

  describe('top shows per genre', () => {
    // Ratings 1 to 10 fill a genre with ten shows whose lowest rating is 1
    const tenShows = Array.from({ length: 10 }, (_, index) => buildTvMazeShow(index + 1, index + 1))

    it('replaces the lowest rated show when a higher rated one arrives', async () => {
      respondWithBatches(tenShows, [buildTvMazeShow(11, 9.5)])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).toEqual([10, 11, 9, 8, 7, 6, 5, 4, 3, 2])
    })

    it('ignores a show rated lower than all the top shows', async () => {
      respondWithBatches(tenShows, [buildTvMazeShow(11, 0.5)])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).not.toContain(11)
    })

    it('ignores a show rated equal to the lowest top show', async () => {
      respondWithBatches(tenShows, [buildTvMazeShow(11, 1)])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).not.toContain(11)
    })

    it('ignores a show without rating once the genre is full', async () => {
      respondWithBatches(tenShows, [buildTvMazeShow(11, null)])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).not.toContain(11)
    })

    it('limits each genre independently', async () => {
      respondWithBatches(tenShows, [buildTvMazeShow(11, 0.5, ['Drama', 'Comedy'])])

      await useShowsStore().loadShows()

      expect(showIdsOf('Drama')).not.toContain(11)
      expect(showIdsOf('Comedy')).toEqual([11])
    })
  })

  describe('loading state', () => {
    it('is loading while the shows are being fetched', async () => {
      let finishFetching: () => void = () => {}
      fetchShowsMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishFetching = resolve
          }),
      )
      const store = useShowsStore()

      const loading = store.loadShows()

      expect(store.isLoading).toBe(true)

      finishFetching()
      await loading

      expect(store.isLoading).toBe(false)
    })

    it('is initially loaded as soon as the first batch arrives', async () => {
      const store = useShowsStore()
      let isInitialLoadedBeforeFirstBatch: boolean | undefined
      let isInitialLoadedAfterFirstBatch: boolean | undefined
      fetchShowsMock.mockImplementation(async (_pagesToFetch, onBatch) => {
        isInitialLoadedBeforeFirstBatch = store.isInitialLoaded
        onBatch([buildTvMazeShow(1, 8)])
        isInitialLoadedAfterFirstBatch = store.isInitialLoaded
        onBatch([buildTvMazeShow(2, 7)])
      })

      await store.loadShows()

      expect(isInitialLoadedBeforeFirstBatch).toBe(false)
      expect(isInitialLoadedAfterFirstBatch).toBe(true)
      expect(store.isInitialLoaded).toBe(true)
    })

    it('is not initially loaded when no batch arrives', async () => {
      respondWithBatches()
      const store = useShowsStore()

      await store.loadShows()

      expect(store.isInitialLoaded).toBe(false)
    })

    it('ignores a load request while already loading', async () => {
      let finishFetching: () => void = () => {}
      fetchShowsMock.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishFetching = resolve
          }),
      )
      const store = useShowsStore()

      const firstLoad = store.loadShows()
      await store.loadShows()
      finishFetching()
      await firstLoad

      expect(fetchShowsMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('errors', () => {
    it('exposes the error message when fetching fails', async () => {
      fetchShowsMock.mockRejectedValue(new Error('Network down'))
      const store = useShowsStore()

      await store.loadShows()

      expect(store.error).toBe('Network down')
      expect(store.isLoading).toBe(false)
    })

    it('keeps the shows delivered before the failure', async () => {
      fetchShowsMock.mockImplementation(async (_pagesToFetch, onBatch) => {
        onBatch([buildTvMazeShow(1, 8)])
        throw new Error('Network down')
      })
      const store = useShowsStore()

      await store.loadShows()

      expect(showIdsOf('Drama')).toEqual([1])
      expect(store.error).toBe('Network down')
    })

    it('clears the previous error when loading again', async () => {
      fetchShowsMock.mockRejectedValueOnce(new Error('Network down'))
      const store = useShowsStore()
      await store.loadShows()

      respondWithBatches([buildTvMazeShow(1, 8)])
      await store.loadShows()

      expect(store.error).toBeNull()
    })
  })
})
