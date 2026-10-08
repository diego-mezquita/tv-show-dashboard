<script setup lang="ts">
import { computed } from 'vue'
import HorizontalShowList from '@/components/HorizontalShowList.vue'
import { useShowsStore } from '@/store/shows'
import type { Show } from '@/types/show'

interface ShowRecommendationsProps {
  show: Show
}

const props = defineProps<ShowRecommendationsProps>()

const MAX_RECOMMENDATIONS = 6

const store = useShowsStore()

const recommendations = computed(() =>
  props.show.genres
    .flatMap((genre) => store.shows[genre] ?? [])
    .filter(
      (candidate, position, candidates) =>
        candidate.id !== props.show.id &&
        // Keep only the first occurrence, since a show can be stored under several genres
        candidates.findIndex((other) => other.id === candidate.id) === position,
    )
    .sort((firstShow, secondShow) => (secondShow.rating ?? 0) - (firstShow.rating ?? 0))
    .slice(0, MAX_RECOMMENDATIONS),
)
</script>

<template>
  <HorizontalShowList v-if="recommendations.length" title="Recommended for you" :shows="recommendations" />
</template>
