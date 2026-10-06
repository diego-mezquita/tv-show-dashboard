import { ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchShows } from '@/services/tvmaze'
import type { Show, ShowsByGenre, TvMazeShow } from '@/types/show'

export const useShowsStore = defineStore('shows', () => {
  const shows = ref<ShowsByGenre>({})
  const isLoading = ref(false)
  const isInitialLoaded = ref(false)
  const error = ref<string | null>(null)

  const PAGES_TO_FETCH = 15
  const TOP_SHOWS_PER_GENRE = 10

  async function loadShows(): Promise<void> {
    if (isLoading.value) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      await fetchShows(PAGES_TO_FETCH, (batch: TvMazeShow[] = []) => {
        updateTopShowsByGenre(batch)

        if (!isInitialLoaded.value) {
          isInitialLoaded.value = true
        }
      })
    } catch (caughtError) {
      error.value = (caughtError as Error).message
    } finally {
      isLoading.value = false
    }
  }

  function updateTopShowsByGenre(batch: TvMazeShow[]): void {
    for (const show of batch) {
      const {genres, rating} = show;

      for (const genre of genres) {
        const genreShows = shows.value[genre]

        if (!genreShows) {
          shows.value[genre] = [buildShowDataModel(show)]
        } else if (genreShows.length < TOP_SHOWS_PER_GENRE) {
          genreShows.push(buildShowDataModel(show))

          sortByRatingDescending(genreShows)
        } else if ((genreShows.at(-1)?.rating ?? 0) < (rating.average ?? 0)) {
          genreShows.pop()
          genreShows.push(buildShowDataModel(show))

          sortByRatingDescending(genreShows)
        }
      }
    }
  }

  function buildShowDataModel({id, url, name, genres, rating, image}: TvMazeShow): Show {
    return {
      id,
      url,
      name,
      genres,
      rating: rating.average,
      image: image?.medium ?? null
    }
  }

  function sortByRatingDescending(genreShows: Show[]): void {
    genreShows.sort((firstShow, secondShow) => (secondShow.rating ?? 0) - (firstShow.rating ?? 0))
  }

  return { shows, isLoading, isInitialLoaded, error, loadShows }
})
