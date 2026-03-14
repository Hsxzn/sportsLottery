import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
const app = createApp(App)
app.use(ElementPlus, { size: 'default', locale: zhCn })
// 忽略自定义元素警告
app.config.productionTip = false
app.config.errorHandler = (err, vm, info) => {
  console.log('errorHandler', err, vm, info)
}
app.config.warnHandler = (msg, instance, trace) => {
  // 自定义警告处理
  if (msg.includes('some warning to ignore')) {
    return
  }
  console.warn(msg, trace)
}

app.mount('#app')
