<script setup lang="ts">
import BrokenTvIcon from '@/components/icons/BrokenTvIcon.vue'
</script>

<template>
  <section class="not-found">
    <BrokenTvIcon class="not-found__icon" aria-hidden="true" />
    <h1 class="not-found__message">Nothing on this channel. We couldn't find the page you're looking for.</h1>
  </section>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-2);
  padding: var(--size-4) var(--size-2);
  text-align: center;
  color: var(--color-text-secondary);
}

.not-found__icon {
  width: var(--size-6);
  height: var(--size-6);
}

.not-found__message {
  margin: 0;
  font-size: var(--font-size-m);
  font-weight: normal;
}
</style>
