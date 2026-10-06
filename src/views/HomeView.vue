<script setup lang="ts">
import GenreList from '@/components/GenreList.vue'
import { useShowsStore } from '@/store/shows'

const store = useShowsStore()
</script>

<template>
  <section class="main">
    <template v-if="store.isInitialLoaded">
      <h1 class="main__title">Top rated TV shows by genre</h1>
      <GenreList
        v-for="(shows, genre) in store.shows"
        :key="genre"
        :genre="genre"
        :shows="shows"
      />
    </template>
    <div v-else-if="store.error" class="main__error">Failed to load TV shows: {{ store.error }}</div>
    <div v-else class="main__loading">Loading shows…</div>
  </section>
</template>

<style scoped>
.main {
  background: var(--color-background-dark);
  padding-top: var(--size-3);
  height: calc(100% - calc(var(--size-3) * 5))
}

.main__loading,
.main__error {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-m);
  height: calc(100vh - calc(var(--size-3) * 5));
}

.main__error {
  color: var(--color-text-error);
}

@media (min-width: 576px) {
  .main {
    height: calc(100% - calc(var(--size-3) * 9));
  }

  .main__loading,
  .main__error {
    height: calc(100vh - calc(var(--size-3) * 9));
  }
}
</style>
