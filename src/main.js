import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VConsole from 'vconsole'
import vant, {Lazyload} from 'vant'
import 'vant/lib/index.css';
import '@/assets/css/font/iconfont.css'
import './js-sdk.umd.prd'
import request from './request/sdkHandle'
import constant from './constant'
// 调试工具
// if (import.meta.env.VITE_APP_ENV === 'dev') {
  new VConsole()
// }

import './assets/css/index.scss'
const app = createApp(App)

// 添加到全局中
app.config.globalProperties.$api = request
app.config.globalProperties.$constant = constant

app.use(router)
app.use(vant)
app.use(Lazyload);

app.mount('#app')
