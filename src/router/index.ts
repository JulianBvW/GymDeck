import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',         component: () => import('@/views/MainView.vue')     },
    { path: '/stats',    component: () => import('@/views/StatsView.vue')    },
    { path: '/fitness',  component: () => import('@/views/FitnessView.vue')  },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
  ],
})

export default router
