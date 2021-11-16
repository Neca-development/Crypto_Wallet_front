import "vuesax/dist/vuesax.css";
import "@/style.scss";

import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: types doesnt exist
import Vuesax from "vuesax";
import axios from "axios";
import VueAxios from "vue-axios";
import Tron from "./plugins/Tron";

Vue.use(Vuesax, {});
Vue.use(VueAxios, axios);
Vue.use(Tron);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
