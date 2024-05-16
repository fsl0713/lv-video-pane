import Vue from 'vue'
import App from './App.vue'
import 'element-ui/lib/theme-chalk/index.css';
import { Select, Option, InputNumber, Message } from 'element-ui';

Vue.use(Select);
Vue.use(Option);
Vue.use(InputNumber);
Vue.prototype.$message = Message;
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
