import type { Show, TvMazeSearchResult, TvMazeShow } from '@/types/show'

const BASE_URL = 'https://api.tvmaze.com'
const CONCURRENCY = 3

export async function searchShows(query: string): Promise<Show[]> {
  const response = await fetch(`${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`)

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`)
  }

  const data: TvMazeSearchResult[] = await response.json()

  return data.map(({ show }) => ({
    id: show.id,
    url: show.url,
    name: show.name,
    genres: show.genres,
    rating: show.rating?.average ?? null,
    image: show.image?.medium ?? null,
  }))
}

/**
 * @param page - Zero-based page index.
 * @returns null when the page does not exist (404), which marks the end of available pages.
 */
async function fetchPage(page: number): Promise<TvMazeShow[] | null> {
  const response = await fetch(`${BASE_URL}/shows?page=${page}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Fetches multiple pages of shows concurrently (up to CONCURRENCY at a time)
 * and invokes `onBatch` for each page that resolves successfully.
 * Stops when pagesToFetch pages were requested; or early when a 404 is encountered,
 * signalling the end of available pages. Pages that fail to load are skipped silently.
 */
export async function fetchShows(
  pagesToFetch: number,
  onBatch: (batch: TvMazeShow[]) => void,
): Promise<void> {
  let page = 0

  while (page < pagesToFetch) {
    const length = page + CONCURRENCY < pagesToFetch ? CONCURRENCY : pagesToFetch - page

    const pagesInBatch = Array.from({ length }, (_, index) => page + index)

    const results = await Promise.allSettled(pagesInBatch.map(fetchPage))

    let done = false

    for (const result of results) {
      if (result.status === 'rejected') {
        continue
      }

      if (result.value === null) {
        done = true
        break
      }

      onBatch(result.value)
    }

    if (done) {
      break
    }

    page = page + length
  }
}
