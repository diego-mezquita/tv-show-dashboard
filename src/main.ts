import '@/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { useShowsStore } from '@/store/shows.ts'

const app = createApp(App)

app.use(createPinia())
app.use(router)

useShowsStore().loadShows()

app.mount('#app')
