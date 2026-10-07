// Subset of the TVMaze `/shows` response that the app reads.
export interface TvMazeShow {
  id: number
  url: string
  name: string
  genres: string[]
  rating: {
    average: number | null
  }
  image: {
    medium: string
    original: string
  } | null
}

// Item of the TVMaze `/search/shows` response.
export interface TvMazeSearchResult {
  score: number
  show: TvMazeShow
}

export interface Show {
  id: number
  url: string
  name: string
  genres: string[]
  rating: number | null
  image: string | null
}

export type ShowsByGenre = Record<string, Show[]>

// Subset of the TVMaze `/shows/:id` response that the detail page reads.
export interface TvMazeShowDetails extends TvMazeShow {
  language: string | null
  runtime: number | null
  premiered: string | null
  ended: string | null
  summary: string | null
}

export interface ShowDetails extends Show {
  language: string | null
  runtime: number | null
  premiered: string | null
  ended: string | null
  summary: string | null
}
