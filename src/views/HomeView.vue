<script setup lang="ts">
import HorizontalShowList from '@/components/HorizontalShowList.vue'
import { useShowsStore } from '@/store/shows'

const store = useShowsStore()
</script>

<template>
  <section class="home">
    <template v-if="store.isInitialLoaded">
      <h1 class="home__title">Top rated TV shows by genre</h1>
      <HorizontalShowList
        v-for="(shows, genre) in store.shows"
        :key="genre"
        :title="genre"
        :shows="shows"
        class="home__show"
      />
    </template>
    <div v-else-if="store.error" class="home__error">Failed to load TV shows: {{ store.error }}</div>
    <div v-else class="home__loading">Loading shows…</div>
  </section>
</template>

<style scoped>
.home {
  background: var(--color-background-dark);
  padding-top: var(--size-3);
}

.home__show {
  padding: 0 var(--size-2) calc(var(--size-2) + var(--size-1));
}

.home__loading,
.home__error {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-m);
  height: calc(100vh - calc(var(--size-2) * 7));
}

.home__error {
  color: var(--color-text-error);
}

.home__title {
  padding: 0 var(--size-2) var(--size-4);
}

@media (min-width: 576px) {
  .home__loading,
  .home__error {
    height: calc(100vh - calc(var(--size-2) * 10));
  }
}
</style>
