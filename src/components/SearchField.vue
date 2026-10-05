<script setup lang="ts">
/**
 * Search input with an icon. On submit, emits the trimmed query and clears the input.
 * Empty (or whitespace-only) queries are ignored.
 */

import { ref } from 'vue'
import SearchIcon from '@/components/icons/SearchIcon.vue'

interface SearchFieldProps {
  /** Initial input value. Only read on mount; later changes are not synced. */
  query?: string
}

export interface SearchFieldEmits {
  /** Fired on form submit with the trimmed, non-empty query. */
  search: [query: string]
}

const props = defineProps<SearchFieldProps>()

const searchQuery = ref(props.query)

function handleSubmit() {
  // Emits 'search' with SearchFieldEmits containing the search criteria
  // (empty or whitespace-only queries are ignored - do not emit!)
  // Show search result panel, if not shown already
}
</script>

<template>
  <search  class="search">
    <form id="search-form" class="search__form" @submit.prevent="handleSubmit">
      <SearchIcon class="search__icon" />
      <input
        v-model="searchQuery"
        type="search"
        class="search__input"
        placeholder="Search TV shows by name..."
        name="search"
        aria-label="Search"
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
