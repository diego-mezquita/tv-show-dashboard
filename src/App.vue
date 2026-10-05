<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <RouterView class="main-view" />
</template>

<style scoped>
.main-view {
  margin-top: var(--size-5);
}

@media (min-width: 576px) {
  .main-view {
    margin-top: var(--size-7);
  }
}
</style>
