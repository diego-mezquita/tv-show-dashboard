import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/shows/:id(\\d+)',
      name: 'show-detail',
      component: () => import('@/views/ShowDetailView.vue'),
      props: (route) => ({ showId: Number(route.params.id) }),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchResultsView.vue'),
      props: (route) => ({ query: typeof route.query.q === 'string' ? route.query.q : '' }),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    }
  ],
})

export default router
