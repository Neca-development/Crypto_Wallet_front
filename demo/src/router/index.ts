import Vue from "vue";
import VueRouter from "vue-router";

import Wallet from "@/views/Wallet.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/wallet/:address",
    name: "Wallet",
    component: Wallet,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
