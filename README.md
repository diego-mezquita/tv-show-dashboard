# TV Show Dashboard

A single-page application that lets users browse the top-rated TV shows by genre and search for shows by name. Clicking a show opens a detail page with its metadata and recommendations of top-rated shows from the same genres.

Data is sourced from the free [TVmaze public API](https://www.tvmaze.com/api) — no API key required.

---

## Prerequisites

| Tool | Version used | Required |
|------|-------------|---------|
| Node.js | `v25.1.0` | `^22.18.0` or `>=24.12.0` (see `engines` in `package.json`) |
| npm | `11.6.2` | no strict minimum (ships with Node.js) |

---

## Getting started

```sh
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev
```

### Other scripts

- `npm run build`: Type-check and build for production into `dist/`
- `npm run preview`: Serve the production build locally (http://localhost:4173)
- `npm run type-check`: Run `vue-tsc` type checking
- `npm run lint`: Run ESLint and auto-fix
- `npm run format`: Run Prettier over `src/`

---

## Running the tests

### Unit tests (Vitest)

```sh
npm run test:unit            # watch mode
npm run test:unit -- --run   # single run
```

Runs all `*.test.ts` files in the `__tests__/` folders under `src/`, using jsdom as the DOM environment.

### End-to-end tests (Playwright)

```sh
# First time only — install the browser binaries (Chromium, Firefox and WebKit)
npx playwright install
# On Linux, also install the system libraries the browsers need
npx playwright install --with-deps

# Run against the dev server (starts it automatically, or reuses one already running)
npm run test:e2e

# Useful flags
npm run test:e2e -- --project=chromium          # a single browser
npm run test:e2e -- --project="Mobile Safari"   # a single mobile browser
npm run test:e2e -- --ui                        # interactive UI mode
npm run test:e2e -- --debug                     # headed + pause on each step
```

> The e2e tests hit the **real TVmaze API**, so they need an internet connection. They run in parallel: TVmaze rate-limits its backend, not its edge cache, and the responses the tests request are cached, so parallel runs don't hit the limit. The suite starts the dev server automatically, or reuses one that is already running.

---

## Project structure

```
src/
├── components/              # Reusable UI components (unit tests in __tests__/)
│   ├── icons/               # SVG icon components
│   ├── AppHeader.vue        # Fixed header: home link + search field
│   ├── HorizontalShowList.vue  # Titled, horizontally scrolling row of show cards
│   ├── SearchField.vue
│   ├── ShowCard.vue
│   └── ShowRecommendations.vue
├── composables/
│   └── useLatestRequest.ts  # Reactive request state; only the latest response wins
├── router/                  # Vue Router configuration
├── services/
│   └── tvmaze.ts            # All TVmaze API calls and response mapping
├── store/
│   └── shows.ts             # Pinia store — top N shows per genre
├── styles/                  # Global CSS and design tokens
├── types/
│   └── show.ts              # API response types and the app's own models
└── views/
    ├── HomeView.vue
    ├── NotFoundView.vue
    ├── SearchResultsView.vue
    └── ShowDetailView.vue
e2e/                         # Playwright end-to-end tests
```

---

## Architectural decisions

### Vue 3

Vue 3 is the current major version of Vue. It is lightweight and flexible, with less configuration than other major modern frameworks like React, which altogether results in faster development and delivery. There is a rather big ecosystem (e.g. Vue Router or Pinia) built and maintained officially.

### Composition API with `<script setup>`

The Composition API groups related logic by feature rather than by option type (`data`, `methods`, `computed`…). Keeping the logic of each part of a component together makes the component easier to follow, and it makes it easy to extract a piece of that logic into a composable for reusability — which is exactly what happened with `useLatestRequest` once a second view needed the same fetching behaviour. `<script setup>` is the recommended, least verbose syntax for it and has the best TypeScript inference.

### TypeScript (strict)

The app is written in TypeScript in strict mode, with `noUncheckedIndexedAccess` enabled. The data flows through several layers (API response → service → store → components), and types keep each boundary explicit: `src/types/show.ts` separates the shape of the TVmaze responses (`TvMazeShow`, `TvMazeShowDetails`) from the app's own, smaller models (`Show`, `ShowDetails`), and the service is the only place that maps one into the other. Component props are typed with `defineProps<…>()`, and generics let `useLatestRequest` return correctly typed data for whatever request it is given, with no casting in the views. Type checking runs with `vue-tsc`, which also understands `.vue` files.

### Vite

It is the most modern standard for web app development. It is built for speed and minimum configuration.

Vite serves source files as native ES modules during development, meaning the browser only loads the modules it actually needs for the current page. This makes cold starts and hot-module replacement near-instant regardless of project size. The production build uses Rolldown under the hood, which produces well-optimised bundles. Vitest (the unit test runner) shares the same config and module resolution, so there is no separate build pipeline to maintain for tests.

### Pinia

Modern standard for Vue stores. It is designed to be easy to use and avoid boilerplate.

Pinia replaced Vuex as Vue's official state management library. It reduces boilerplate code by removing mutations (state is modified directly inside actions), has a simpler and more natural way of interacting with it, and has first-class TypeScript support.
In this project the store holds pre-processed genre → show lists that multiple components read independently (`HomeView` for the genre rows, `ShowRecommendations` for the recommendation picks), which is exactly the use case a shared reactive store is designed for. Another reason for having the store is the large amount of information (the TV shows list endpoint has 380+ pages of 250 shows each) that rarely changes, so there is no need to request it ever again after the first time (for the duration of the session). The store starts loading at app start-up, so it is ready by the time the user opens the home page — or fills in the background when the user lands directly on a detail page.

### Vue Router

In a Single Page Application a system to handle routes and navigation is needed to provide the best experience. Vue Router is Vue's official router.

- **The URL is the source of truth.** Views receive their input as props derived from the route (`/shows/:id` → `showId: number`, `/search?q=…` → `query`), so they never read the router themselves and are easy to test. The detail route only matches numeric ids (`/shows/:id(\d+)`).
- **Search results have their own route.** A search has its own URL, so it can be bookmarked or shared, survives a page reload, and the browser's back button works without extra code: going from a result to its detail page and back returns to the results. The header's search field follows `route.query.q`, so it always shows the right text after back/forward navigation.
- **Unknown URLs show a not-found page** instead of silently redirecting home. The header stays visible there, so the user can search or go home from it.

One non-obvious consequence of using a client-side router is that navigating between two show detail pages (e.g. `/shows/1` → `/shows/2`, through a recommendation) reuses the same `ShowDetailView` instance — Vue Router does not unmount and remount it. Fetching in `onMounted` would therefore not re-run on the second navigation. The fetch is driven by a `watch` on the `showId` prop instead (see below), which fires both on mount and on every subsequent change.

### `useLatestRequest` composable

`useLatestRequest(source, request)` holds the `data / isLoading / error` state that every async request needs, runs the request immediately and again whenever its reactive source changes, and is used by both `ShowDetailView` and `SearchResultsView`:

```ts
const { data: show, isLoading, error } = useLatestRequest(() => props.showId, fetchShowById)
```

Its main job is to avoid a **race condition**: requests don't finish in the order they started. Without protection, searching "the" and then quickly "the wire" could show the results of "the" if that slower request finished last — or end the loading state early, or replace good results with an outdated error. The rule is that only the most recently started request may update the state. It is implemented with Vue 3.5's `onWatcherCleanup`: each run registers a cleanup that marks it as outdated when the next run starts (or when the component unmounts), and an outdated run ignores its result, its error and its end of loading.

Outdated requests are ignored rather than cancelled with an `AbortController`: the responses are small, an aborted request has already reached the API anyway, and cancelling would require passing a signal through every service function and filtering abort errors — complexity without a visible benefit here.

### Top-N-per-genre store optimization strategy

The store does not cache all shows. Each genre list is capped at `TOP_SHOWS_PER_GENRE` (currently 10) entries and kept sorted by rating. When a new batch arrives, the lowest-rated show is evicted if the new show scores higher. This bounds memory use regardless of how many pages are fetched. Another memory optimization is that the store only keeps the needed information per show, instead of the entire show object, which is quite large.

The trade-off is that the rankings are only final once every page has been processed: until then, a show on a page that hasn't loaded yet can still enter a genre's top list. The page is usable as soon as the first shows arrive, and the lists settle into the real top shows of the whole catalogue once loading finishes, while the store size stays predictable throughout.

### Concurrent batch fetching

`fetchShows` fires up to `CONCURRENCY` (currently 10) API requests at a time. Pages within a batch are fetched with `Promise.allSettled`, so a single failing page does not abort the rest. A 404 response signals that no more pages exist and stops the loop early. The home page renders as soon as the first batch arrives, and the lists keep improving as later batches come in.

Fetching all pages at once would hit the API with a burst of requests that could trigger rate-limiting. Fetching one page at a time would be safe but slow. The logic has been designed for scalability, with easy configuration of the concurrent requests and of the maximum number of pages to fetch, `PAGES_TO_FETCH` (currently 500). That is above the 380+ pages that exist, so in practice the app loads every page and stops at the first 404.

### Recommendations

`ShowRecommendations` takes the stored shows of the current show's genres, removes the show itself and duplicates (a show can be stored under several genres), sorts them by rating and keeps the top `MAX_RECOMMENDATIONS` (currently 6). It reuses the already loaded store data, so recommendations cost no extra API requests, and the result is deterministic. It renders through the same `HorizontalShowList` component as the home page rows — a generic "titled row of show cards", which is why it was renamed from `GenreList`.

### No `v-html` for show summaries

TVmaze returns show summaries as HTML. Rendering third-party markup with `v-html` would open the door to script injection, so the service converts summaries to plain text before they reach the views. The cost is losing minor formatting such as bold text.

### No CSS framework

This project uses CSS custom properties defined once in a global stylesheet as the design system. Components reference those tokens (`var(--size-3)`, `var(--color-text-secondary)`) directly in `<style scoped>` blocks, so the visual language is consistent and changes to the palette or scale propagate everywhere automatically without a build step or configuration file.

### Accessibility

Accessibility is treated as part of "done": semantic HTML first (`<header>`, `<main>` and `<search>` landmarks, headings in order, real `<a>` links for every clickable card), list semantics and labelled regions for the scrolling rows, `alt` text on posters, accessible names on icon-only links, and loading, error and "no results" messages announced with `role="status"` / `role="alert"`. Visible focus styles are kept.

The `<search>` element is supported by all major browsers since 2023, but Vue's built-in list of HTML tags does not include it yet, so `vite.config.ts` tells the template compiler to treat it as a native element.

### Vitest + Vue Test Utils for unit tests

Vitest is Vite-native and works the same way Vite works within the app (module resolution, alias config, etc.). It reuses the app's Vite config, so there is no separate test configuration to keep in sync, and tests import components exactly the same way the app does. It is also fast: it runs tests in parallel and, in watch mode, only re-runs the tests affected by a change.

Components are tested with Vue Test Utils' `mount`, so real child components render and the integration between them is covered. Tests follow a black-box approach — they assert what renders for given props, store data or user interactions, not how the component works internally — and stay small, with one concern per test. Composables are tested inside a minimal host component (`withSetup`), as recommended by the Vue docs.

### Playwright for e2e tests

Playwright runs tests in real browser engines with an easy API for locating elements and simulating user interactions, and easy configuration of multiple browsers and devices, retries and traces. The suite runs every journey in Chrome, Firefox and Safari on desktop, and in Chrome and Safari on mobile, covering the three major rendering engines (Chromium, Gecko and WebKit) and phone-sized screens.

The e2e tests cover **complete user journeys** across views — the parts unit tests can't, where the router, browser history, store and header work together:

- navigating to a show detail page from the home page,
- searching for a show, opening a result, going back to the results and opening a different show,
- navigating through recommendations and back to the home page.

They run against the **real TVmaze API**, so they check the app end to end with real data. Because that data changes over time, the tests never assert fixed show names: each journey reads the title of the card it opens and expects it as the next page's heading.

---

## Assumptions and limitations

### Dataset

The show list endpoint, which returns paginated data of 250 shows per page, has 380+ pages — more than 90 thousand shows. Requesting and storing all of them takes time and resources, so the app fetches every page but only keeps what it needs:

- Each genre list shows its top `TOP_SHOWS_PER_GENRE` (currently 10) shows.
- Shows are fetched and processed page by page, so the rankings can still change while the remaining pages are loading.
- The number of concurrent requests, `CONCURRENCY` (currently 10), is kept relatively low.

All of these are easy to configure, which leaves room for future optimization.

### Real API in the e2e tests

Using the real API makes the e2e tests realistic, but they depend on TVmaze being available and responsive. The suite uses generous timeouts for real network calls; a failure is worth re-running before suspecting the code.

### API responses are not validated at runtime

The service types the API responses with TypeScript, but does not validate them at runtime, so malformed data from the API would not be caught at the boundary.

---

## Next steps and iterations

### Improve the top ranked show lists

Test how adjusting the number of simultaneous requests and shows in the ranking affects the app performance and the user experience, with the goal of having the complete rankings available to the user as quickly as possible without impacting usability.

### Improve user understanding of the app

While the remaining pages are still loading, show an indicator explaining that the rankings are still being completed, so the user understands why the top shows by genre can change during the first moments of using the app.

### Runtime validation of API responses

Validate the TVmaze responses at the service boundary (e.g. with Zod schemas, deriving the TypeScript types from them).

### Automation

A CI/CD pipeline will help automate the process and make sure every step needed before a change goes to production is done, including all the quality assurance steps (lint, type check, unit and e2e tests). The Playwright config is already prepared for it: when the `CI` environment variable is set, it tests the production build (`npm run build-only && npm run preview`) instead of the dev server, retries failed tests twice, and fails if a `test.only` was left in.

---

## Possible features

All these features assume that the app will remain a frontend-only app. They are not in order.

### Favourite genres

The top shows per genre lists shown in the home view are not sorted in any way. A user that likes e.g. action TV shows might need to scroll down until reaching the action genre list. With the possibility to set genres as favourites, the user would see those genres at the beginning of the page.

### Show the TV show's rank in the show card

With a top 10 shows per genre, it is easy for the user to tell where a show sits in the ranking (at the beginning, middle or end), since the list is short. With longer lists (e.g. a top 80) that becomes harder, so the user would benefit from seeing the show's rank (e.g. `#56`) on its card.

### Cast list and detail page

The user could benefit from a cast section in the show detail page, linking to a cast member detail page. `useLatestRequest` could be reused right away to request both pieces of information: the show's cast and the cast member's details.

### Translate to other languages

Translating the app to different languages would help bring it to a broader audience.

### Light / dark mode

Giving users the option to choose between the current dark version and a new light version. The design tokens make this mostly a matter of redefining the colour variables.
