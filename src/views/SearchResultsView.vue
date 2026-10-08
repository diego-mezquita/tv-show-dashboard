<script setup lang="ts">
import { computed } from 'vue'
import ShowCard from '@/components/ShowCard.vue'
import { useLatestRequest } from '@/composables/useLatestRequest'
import { searchShows } from '@/services/tvmaze'
import type { Show } from '@/types/show'

interface SearchResultsViewProps {
  query: string
}

const props = defineProps<SearchResultsViewProps>()

const trimmedQuery = computed(() => props.query.trim())

const { data, isLoading, error } = useLatestRequest(
  () => trimmedQuery.value,
  // A blank query would ask the API for every show, so it resolves to no results instead
  (query): Promise<Show[]> => (query ? searchShows(query) : Promise.resolve([])),
)

const results = computed(() => data.value ?? [])
</script>

<template>
  <section class="search-results">
    <p v-if="isLoading" class="search-results__status" role="status">Searching…</p>
    <p v-else-if="error" class="search-results__status search-results__status--error" role="alert">
      Failed to search shows: {{ error }}
    </p>
    <p v-else-if="!trimmedQuery" class="search-results__status">Type a show name to search</p>
    <p v-else-if="results.length === 0" class="search-results__status" role="status">
      No results for "{{ trimmedQuery }}"
    </p>
    <div v-else>
      <h1>Search results</h1>
      <ul class="search-results__results">
        <li v-for="show in results" :key="show.id">
          <ShowCard :show="show" />
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.search-results {
  flex: 1;
  overflow-y: auto;
  padding: var(--size-2);
}

.search-results__status {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--size-4) 0;
}

.search-results__status--error {
  color: var(--color-text-error);
}

.search-results__results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--size-7), 1fr));
  gap: var(--size-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
