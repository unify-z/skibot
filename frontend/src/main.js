import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
const app = createApp(App)
app.config.warnHandler = function (msg, vm, trace) {

  };
app.use(naive)
app.use(router)
app.mount('#app')
