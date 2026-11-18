import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'

import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// Vant 4 全量注册；如需按需引入，可改用 unplugin-vue-components + @vant/auto-import-resolver
app.use(Vant)

app.mount('#app')
