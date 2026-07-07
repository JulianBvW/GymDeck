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

// After a new deploy, a still-open session runs the old index bundle whose lazy
// chunk hashes no longer exist on the server — dynamic imports then fail and
// navigation dies silently. Reload once to pick up the fresh bundle.
router.onError((error, to) => {
  const message = error instanceof Error ? error.message : String(error)
  if (/error loading dynamically imported module|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)) {
    const target = to.fullPath
    const alreadyRetried = sessionStorage.getItem('chunk-reload') === target
    if (!alreadyRetried) {
      sessionStorage.setItem('chunk-reload', target)
      window.location.assign(target)
    }
  }
})

router.afterEach(() => {
  sessionStorage.removeItem('chunk-reload')
})

export default router
