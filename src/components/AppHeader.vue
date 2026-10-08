<script setup lang="ts">
/**
 * App header containing the home link, as an icon, and the search field for searching TV shows by name.
 * It is always at the very top of the screen for better UX.
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HomeIcon from '@/components/icons/HomeIcon.vue'
import SearchField from '@/components/SearchField.vue'

const route = useRoute()
const router = useRouter()

// The URL is the source of truth, so the field shows the right query after back/forward or a page reload
const currentQuery = computed(() => {
  const query = route.name === 'search' ? route.query.q : undefined

  return typeof query === 'string' ? query : ''
})

function goToSearchResults(query: string) {
  router.push({ name: 'search', query: { q: query } })
}
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="home-link" aria-label="Home">
      <HomeIcon aria-hidden="true" />
    </RouterLink>
    <SearchField class="search-input" :query="currentQuery" @search="goToSearchResults" />
  </header>
</template>

<style scoped>
.app-header {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: var(--size-2);
  background-color: var(--color-background);
}

.home-link {
  width: var(--size-4);
  height: var(--size-4);
  padding-right: var(--size-1);
  color: currentColor;
  flex-shrink: 0;
}

@media (min-width: 576px) {
  .home-link {
    width: var(--size-6);
    height: var(--size-6);
  }
}
</style>
