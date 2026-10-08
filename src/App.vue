<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="main-view">
    <RouterView />
  </main>
</template>

<style scoped>
.main-view {
  margin-top: var(--size-5);
}

@media (min-width: 576px) {
  .main-view {
    margin-top: calc(var(--size-2) * 8);
  }
}
</style>
