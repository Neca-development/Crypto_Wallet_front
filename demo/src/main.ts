import "vuesax/dist/vuesax.css";
import "@/style.scss";

import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// @ts-ignore: types doesnt exist
import Vuesax from "vuesax";

Vue.use(Vuesax, {});
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
