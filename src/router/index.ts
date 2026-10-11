import { createRouter, createWebHashHistory } from 'vue-router'

// Hash history: works on any static host without server-side rewrites.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/deck/:id', name: 'deck', component: () => import('@/views/DeckView.vue'), props: true },
    { path: '/play/:id', name: 'play', component: () => import('@/views/PlayView.vue'), props: true },
    { path: '/edit/:id', name: 'edit', component: () => import('@/views/EditDeckView.vue'), props: true },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(_to, _from, saved) {
    return saved ?? { top: 0 }
  },
})

export default router
