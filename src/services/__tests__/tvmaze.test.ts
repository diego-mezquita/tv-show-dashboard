import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchShowById, fetchShows, searchShows } from '@/services/tvmaze'
import type { TvMazeShow, TvMazeShowDetails } from '@/types/show'

function buildTvMazeShow(overrides: Partial<TvMazeShow> = {}): TvMazeShow {
  return {
    id: 1,
    url: 'https://www.tvmaze.com/shows/1/under-the-dome',
    name: 'Under the Dome',
    genres: ['Drama'],
    rating: { average: 6.5 },
    image: {
      medium: 'https://static.tvmaze.com/medium.jpg',
      original: 'https://static.tvmaze.com/original.jpg',
    },
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function requestedUrls(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map(([url]) => String(url))
}

function pageOf(url: string): number {
  return Number(new URL(url).searchParams.get('page'))
}

describe('tvmaze service', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('searchShows', () => {
    it('requests the search endpoint with the encoded query', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]))

      await searchShows('the office & co')

      expect(requestedUrls(fetchMock)).toEqual([
        'https://api.tvmaze.com/search/shows?q=the%20office%20%26%20co',
      ])
    })

    it('returns the matching shows mapped to the app model', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ score: 0.9, show: buildTvMazeShow() }]))

      const shows = await searchShows('dome')

      expect(shows).toEqual([
        {
          id: 1,
          url: 'https://www.tvmaze.com/shows/1/under-the-dome',
          name: 'Under the Dome',
          genres: ['Drama'],
          rating: 6.5,
          image: 'https://static.tvmaze.com/medium.jpg',
        },
      ])
    })

    it('returns null rating and image when the show has none', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([{ score: 0.9, show: buildTvMazeShow({ rating: { average: null }, image: null }) }]),
      )

      const [show] = await searchShows('dome')

      expect(show?.rating).toBeNull()
      expect(show?.image).toBeNull()
    })

    it('returns an empty list when nothing matches', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]))

      expect(await searchShows('nothing matches this')).toEqual([])
    })

    it('throws when the response is not successful', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 500))

      await expect(searchShows('dome')).rejects.toThrow('HTTP error 500')
    })

    it('throws when the network request fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(searchShows('dome')).rejects.toThrow('Failed to fetch')
    })
  })

  describe('fetchShowById', () => {
    function buildTvMazeShowDetails(overrides: Partial<TvMazeShowDetails> = {}): TvMazeShowDetails {
      return {
        ...buildTvMazeShow(),
        language: 'English',
        runtime: 60,
        premiered: '2013-06-24',
        ended: '2015-09-10',
        summary: '<p><b>Under the Dome</b> is the story of a small town.</p>',
        ...overrides,
      }
    }

    it('requests the show endpoint for the given id', async () => {
      fetchMock.mockResolvedValue(jsonResponse(buildTvMazeShowDetails()))

      await fetchShowById(42)

      expect(requestedUrls(fetchMock)).toEqual(['https://api.tvmaze.com/shows/42'])
    })

    it('returns the show mapped to the app model, with the large poster', async () => {
      fetchMock.mockResolvedValue(jsonResponse(buildTvMazeShowDetails()))

      expect(await fetchShowById(1)).toEqual({
        id: 1,
        url: 'https://www.tvmaze.com/shows/1/under-the-dome',
        name: 'Under the Dome',
        genres: ['Drama'],
        rating: 6.5,
        image: 'https://static.tvmaze.com/original.jpg',
        language: 'English',
        runtime: 60,
        premiered: '2013-06-24',
        ended: '2015-09-10',
        summary: 'Under the Dome is the story of a small town.',
      })
    })

    it('returns null for every missing optional field', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          buildTvMazeShowDetails({
            rating: { average: null },
            image: null,
            language: null,
            runtime: null,
            premiered: null,
            ended: null,
            summary: null,
          }),
        ),
      )

      expect(await fetchShowById(1)).toMatchObject({
        rating: null,
        image: null,
        language: null,
        runtime: null,
        premiered: null,
        ended: null,
        summary: null,
      })
    })

    describe('summary', () => {
      it('strips markup so it is never rendered as HTML', async () => {
        fetchMock.mockResolvedValue(
          jsonResponse(buildTvMazeShowDetails({ summary: '<p>Safe<img src="x" onerror="alert(1)"> text</p>' })),
        )

        const show = await fetchShowById(1)

        expect(show.summary).toBe('Safe text')
      })

      it('returns null when the summary only contains markup', async () => {
        fetchMock.mockResolvedValue(jsonResponse(buildTvMazeShowDetails({ summary: '<p> </p>' })))

        const show = await fetchShowById(1)

        expect(show.summary).toBeNull()
      })
    })

    it('throws a not found error when the show does not exist', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 404))

      await expect(fetchShowById(999999)).rejects.toThrow('Show not found')
    })

    it('throws when the response is not successful', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 500))

      await expect(fetchShowById(1)).rejects.toThrow('HTTP error 500')
    })

    it('throws when the network request fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(fetchShowById(1)).rejects.toThrow('Failed to fetch')
    })
  })

  describe('fetchShows', () => {
    // Each page holds a single show whose id equals the page number, so batches can be told apart
    function respondWithPages(statusByPage: Record<number, number> = {}) {
      fetchMock.mockImplementation(async (url: string) => {
        const page = pageOf(url)
        const status = statusByPage[page] ?? 200

        return status === 200 ? jsonResponse([buildTvMazeShow({ id: page })]) : jsonResponse({}, status)
      })
    }

    function deliveredPages(onBatch: ReturnType<typeof vi.fn>): number[] {
      return onBatch.mock.calls.map(([batch]) => (batch as TvMazeShow[])[0]!.id)
    }

    it('requests and delivers every page up to the requested amount, in order', async () => {
      respondWithPages()
      const onBatch = vi.fn()

      await fetchShows(5, onBatch)

      expect(requestedUrls(fetchMock).map(pageOf)).toEqual([0, 1, 2, 3, 4])
      expect(deliveredPages(onBatch)).toEqual([0, 1, 2, 3, 4])
    })

    it('requests the shows endpoint', async () => {
      respondWithPages()

      await fetchShows(1, vi.fn())

      expect(requestedUrls(fetchMock)).toEqual(['https://api.tvmaze.com/shows?page=0'])
    })

    it('delivers the shows of each page unchanged', async () => {
      const pageShows = [buildTvMazeShow({ id: 1 }), buildTvMazeShow({ id: 2, image: null })]
      fetchMock.mockResolvedValue(jsonResponse(pageShows))
      const onBatch = vi.fn()

      await fetchShows(1, onBatch)

      expect(onBatch).toHaveBeenCalledWith(pageShows)
    })

    it('does not request anything when no pages are requested', async () => {
      const onBatch = vi.fn()

      await fetchShows(0, onBatch)

      expect(fetchMock).not.toHaveBeenCalled()
      expect(onBatch).not.toHaveBeenCalled()
    })

    it('requests at most three pages at the same time', async () => {
      const pendingResponses: Array<() => void> = []
      fetchMock.mockImplementation(
        (url: string) =>
          new Promise<Response>((resolve) => {
            pendingResponses.push(() => resolve(jsonResponse([buildTvMazeShow({ id: pageOf(url) })])))
          }),
      )

      const fetching = fetchShows(5, vi.fn())
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))

      pendingResponses.splice(0).forEach((resolvePending) => resolvePending())
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5))

      pendingResponses.splice(0).forEach((resolvePending) => resolvePending())
      await fetching
    })

    describe('when a page does not exist', () => {
      it('stops delivering at the missing page', async () => {
        respondWithPages({ 1: 404 })
        const onBatch = vi.fn()

        await fetchShows(5, onBatch)

        expect(deliveredPages(onBatch)).toEqual([0])
      })

      it('does not request further pages', async () => {
        respondWithPages({ 2: 404, 3: 404, 4: 404 })

        await fetchShows(5, vi.fn())

        expect(requestedUrls(fetchMock).map(pageOf)).toEqual([0, 1, 2])
      })
    })

    describe('when a page fails to load', () => {
      it('skips the page when the server responds with an error', async () => {
        respondWithPages({ 1: 500 })
        const onBatch = vi.fn()

        await fetchShows(5, onBatch)

        expect(deliveredPages(onBatch)).toEqual([0, 2, 3, 4])
      })

      it('skips the page when the network request fails', async () => {
        respondWithPages()
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
        const onBatch = vi.fn()

        await fetchShows(3, onBatch)

        expect(onBatch).toHaveBeenCalledTimes(2)
      })

      it('resolves without delivering anything when every page fails', async () => {
        fetchMock.mockResolvedValue(jsonResponse({}, 503))
        const onBatch = vi.fn()

        await expect(fetchShows(4, onBatch)).resolves.toBeUndefined()
        expect(onBatch).not.toHaveBeenCalled()
      })
    })
  })
})
