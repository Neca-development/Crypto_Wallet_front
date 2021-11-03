import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

import Wallet from "@/views/Wallet.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
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
