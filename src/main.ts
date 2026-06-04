import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js'

import App from './App.vue'
import router from './router'

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
