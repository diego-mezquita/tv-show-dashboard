<script setup lang="ts">
/**
 * App header containing the home link, as an icon, and the search field for searching TV shows by name.
 * It is always at the very top of the screen for better UX.
 */

import HomeIcon from '@/components/icons/HomeIcon.vue'
import SearchField from '@/components/SearchField.vue'
</script>

<template>
  <div class="app-header">
    <RouterLink to="/" class="home-link">
      <HomeIcon />
    </RouterLink>
    <SearchField class="search-input"/>
  </div>
</template>

<style scoped>
.app-header {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: var(--size-2);
}

.home-link {
  width: var(--size-4);
  height: var(--size-4);
  color: currentColor;
  flex-shrink: 0;
}

@media (min-width: 576px) {
  .home-link {
    width: var(--size-6);
    height: var(--size-6);
  }
}
</style>
