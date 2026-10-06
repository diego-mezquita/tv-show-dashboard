<script setup lang="ts">
import { useId } from 'vue'
import ShowCard from '@/components/ShowCard.vue'
import type { Show } from '@/types/show'

interface GenreListProps {
  genre: string
  shows: Show[]
}

defineProps<GenreListProps>()

const titleId = useId()
</script>

<template>
  <section class="genre-row" :aria-labelledby="titleId">
    <h2 :id="titleId" class="genre-row__title">{{ genre }}</h2>
    <ul class="genre-row__shows" :aria-labelledby="titleId">
      <li v-for="show in shows" :key="show.id" class="genre-row__card">
        <ShowCard :show="show" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.genre-row {
  padding: 0 16px 24px;
}

.genre-row__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-bold);
  margin: var(--size-2) 0 var(--size-3);
  text-transform: uppercase;
}

.genre-row__shows {
  display: flex;
  gap: var(--size-2);
  overflow-x: auto;
  margin: 0;
  padding: 0 0 var(--size-2);
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--color-background-lighter) transparent;
}

.genre-row__card {
  flex: 0 0 var(--size-7);
}
</style>
