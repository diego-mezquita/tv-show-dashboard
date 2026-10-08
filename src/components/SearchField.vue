<script setup lang="ts">
/**
 * Search input with an icon. On submit, emits the trimmed query.
 * Empty (or whitespace-only) queries are ignored.
 */

import { ref, watch } from 'vue'
import SearchIcon from '@/components/icons/SearchIcon.vue'

interface SearchFieldProps {
  /** Current search query. The input follows it whenever it changes, e.g. on back/forward navigation. */
  query?: string
}

interface SearchFieldEmits {
  /** Fired on form submit with the trimmed, non-empty query. */
  search: [query: string]
}

const props = withDefaults(defineProps<SearchFieldProps>(), { query: '' })
const emit = defineEmits<SearchFieldEmits>()

const searchQuery = ref(props.query)

watch(
  () => props.query,
  (query) => {
    searchQuery.value = query
  },
)

function handleSubmit() {
  const trimmedQuery = searchQuery.value.trim()

  if (!trimmedQuery) {
    return
  }

  searchQuery.value = trimmedQuery
  emit('search', trimmedQuery)
}
</script>

<template>
  <search class="search">
    <form class="search__form" @submit.prevent="handleSubmit">
      <SearchIcon class="search__icon" aria-hidden="true" />
      <input
        v-model="searchQuery"
        type="search"
        class="search__input"
        placeholder="Search TV shows by name..."
        name="search"
        aria-label="Search TV shows by name"
      />
    </form>
  </search>
</template>

<style scoped>
.search {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 1;
  flex-grow: 1;
}

.search__form {
  display: flex;
  max-width: var(--size-8);
  flex-shrink: 1;
  flex-grow: 1;
  border-radius: var(--radius-m);
  align-items: center;
  justify-content: space-between;
  border: var(--border-s) var(--color-border-focus);
}

.search__form:focus-within {
  outline: none;
  box-shadow: var(--shadow-m);
}

.search__input {
  height: var(--size-3);
  border: none;
  flex-grow: 1;
  color: inherit;
  background: transparent;
  padding: 0 var(--size-1);
  outline: none;
}

.search__icon {
  width: var(--size-2);
  height: var(--size-2);
  margin-left: var(--size-1);
  margin-right: var(--size-1);
  flex-grow: 0;
  color: var(--color-border-focus);
}
</style>
