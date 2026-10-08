<script setup lang="ts">
import { useId } from 'vue'
import ShowCard from '@/components/ShowCard.vue'
import type { Show } from '@/types/show'

interface HorizontalShowListProps {
  title: string
  shows: Show[]
}

defineProps<HorizontalShowListProps>()

const titleId = useId()
</script>

<template>
  <section class="horizontal-show-list" :aria-labelledby="titleId">
    <h2 :id="titleId" class="horizontal-show-list__title">{{ title }}</h2>
    <ul class="horizontal-show-list__shows" :aria-labelledby="titleId">
      <li v-for="show in shows" :key="show.id" class="horizontal-show-list__card">
        <ShowCard :show="show" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.horizontal-show-list__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-bold);
  margin: var(--size-2) 0 var(--size-3);
  padding-left: calc(var(--size-1) / 2);
  text-transform: uppercase;
}

.horizontal-show-list__shows {
  display: flex;
  gap: var(--size-2);
  overflow-x: auto;
  margin: 0;
  padding: calc(var(--size-1) / 2) calc(var(--size-1) / 2) var(--size-2);
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--color-background-lighter) transparent;
}

.horizontal-show-list__card {
  flex: 0 0 var(--size-7);
  min-width: 0;
}
</style>
