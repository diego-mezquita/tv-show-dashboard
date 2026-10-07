<script setup lang="ts">
import type { Show } from '@/types/show'

interface ShowCardProps {
  show: Show
}

defineProps<ShowCardProps>()
</script>

<template>
  <RouterLink :to="{ name: 'show-detail', params: { id: show.id } }" class="show-card-link">
    <div class="show-card">
      <img
        v-if="show.image"
        :src="show.image"
        :alt="show.name"
        class="show-card__image"
        loading="lazy"
      />
      <div v-else class="show-card__image show-card__image--placeholder" aria-hidden="true" >
        <span>Not available</span>
      </div>
      <div class="show-card__info">
        <span class="show-card__title">{{ show.name }}</span>
        <span class="show-card__genres">{{ show.genres.join(', ') || '—' }}</span>
        <span v-if="show.rating !== null" class="show-card__rating">
          <span aria-hidden="true">★</span>
          <span class="visually-hidden">Rating:</span>
          {{ show.rating }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.show-card-link {
  display: block;
  //color: inherit;
  border-radius: var(--radius-m);
}

.show-card-link:focus-visible {
  outline: var(--border-s) var(--color-border-focus);
  outline-offset: 2px;
}

.show-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-3);
  padding: var(--size-2);
  border-radius: var(--radius-m);
  background: var(--color-background-light);
  overflow: hidden;
}

.show-card:hover {
  box-shadow: var(--shadow-m);
}

.show-card__image {
  width: calc(var(--size-3) * 13);
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: var(--radius-s);
  flex-shrink: 0;
}

.show-card__image--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-empty);
}

.show-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--size-1);
  min-width: 0;
  width: 100%;
}

.show-card__title {
  font-weight: var(--font-weight-bold);
  white-space: wrap;
}

.show-card__genres {
  font-size: var(--font-size-s);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.show-card__rating {
  font-size:var(--font-size-s);
  color: var(--color-text-warning);
  font-weight: var(--font-weight-bold);
}
</style>
