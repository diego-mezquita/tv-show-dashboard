<script setup lang="ts">
/**
 * Show detail page. Fetches the show whenever `showId` changes (including on
 * initial navigation), since navigating between detail pages reuses this component.
 */
import { ref, watch } from 'vue'
import { fetchShowById } from '@/services/tvmaze'
import type { ShowDetails } from '@/types/show'

interface ShowDetailViewProps {
  showId: number
}

const props = defineProps<ShowDetailViewProps>()

const show = ref<ShowDetails | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Responses can arrive out of order when showId changes quickly; only the latest request may update the page
let latestRequestId = 0

async function loadShow(showId: number): Promise<void> {
  latestRequestId = latestRequestId + 1
  const requestId = latestRequestId

  show.value = null
  error.value = null
  isLoading.value = true

  try {
    const loadedShow = await fetchShowById(showId)

    if (requestId === latestRequestId) {
      show.value = loadedShow
    }
  } catch (caughtError) {
    if (requestId === latestRequestId) {
      error.value = (caughtError as Error).message
    }
  } finally {
    if (requestId === latestRequestId) {
      isLoading.value = false
    }
  }
}

watch(() => props.showId, loadShow, { immediate: true })
</script>

<template>
  <article class="show-detail">
    <p v-if="isLoading" class="show-detail__status" role="status">Loading show…</p>
    <p v-else-if="error" class="show-detail__status show-detail__status--error" role="alert">
      Failed to load the show: {{ error }}
    </p>

    <template v-else-if="show">
      <h1 class="show-detail__title">{{ show.name }}</h1>

      <div class="show-detail__main">
        <img v-if="show.image" :src="show.image" :alt="show.name" class="show-detail__image" />
        <div v-else class="show-detail__image show-detail__image--placeholder" aria-hidden="true">
          <span>Not available</span>
        </div>

        <dl class="show-detail__meta">
          <div v-if="show.genres.length" class="show-detail__meta-row">
            <dt>Genres</dt>
            <dd>
              <ul class="show-detail__genres">
                <li v-for="genre in show.genres" :key="genre" class="show-detail__genre">
                  {{ genre }}
                </li>
              </ul>
            </dd>
          </div>

          <div class="show-detail__meta-row">
            <dt>Language</dt>
            <dd>{{ show.language ?? '—' }}</dd>
          </div>

          <div class="show-detail__meta-row">
            <dt>Runtime</dt>
            <dd>{{ show.runtime ? `${show.runtime} min` : '—' }}</dd>
          </div>

          <div class="show-detail__meta-row">
            <dt>Premiered</dt>
            <dd>{{ show.premiered ?? '—' }}</dd>
          </div>

          <div class="show-detail__meta-row">
            <dt>Ended</dt>
            <dd>{{ show.ended ?? '—' }}</dd>
          </div>
        </dl>
      </div>

      <p v-if="show.summary" class="show-detail__summary">{{ show.summary }}</p>
    </template>
  </article>
</template>

<style scoped>
.show-detail {
  max-width: calc(var(--size-3) * 60);
  margin: 0 auto;
  padding: var(--size-4);
}

.show-detail__status {
  text-align: center;
  color: var(--color-text-secondary);
}

.show-detail__status--error {
  color: var(--color-text-error);
}

.show-detail__title {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--size-4);
}

.show-detail__main {
  display: flex;
  flex-direction: column;
  gap: var(--size-4);
  align-items: center;
}

.show-detail__image {
  width: calc(var(--size-3) * 20);
  flex-shrink: 0;
  border-radius: var(--radius-m);
  object-fit: cover;
}

.show-detail__image--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-empty);
  height: calc(var(--size-3) * 26);
  border-radius: var(--radius-m);
}

.show-detail__meta {
  display: flex;
  flex-direction: column;
  gap: var(--size-3);
  margin: 0;
  align-self: flex-start;
}

.show-detail__meta-row {
  display: flex;
  flex-direction: column;
  gap: var(--size-1);
}

.show-detail__meta-row dt {
  font-size: var(--font-size-s);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.show-detail__meta-row dd {
  margin: 0;
  font-weight: var(--font-weight-bold);
}

.show-detail__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.show-detail__genre {
  background: var(--color-background-light);
  padding: var(--size-1) var(--size-2);
  border-radius: var(--radius-s);
  font-size: var(--font-size-s);
}

.show-detail__summary {
  margin-top: var(--size-4);
  line-height: 1.7;
  color: var(--color-text);
}

@media (min-width: 576px) {
  .show-detail__main {
    flex-direction: row;
    align-items: flex-start;
  }
}
</style>
