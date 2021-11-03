<template>
  <div id="app">
    <app-sidebar></app-sidebar>
    <router-view />
  </div>
</template>
<script>
import SidebarVue from "./components/Sidebar.vue";
import TronWeb from "tronweb";
import { mapActions } from "vuex";

export default {
  components: {
    "app-sidebar": SidebarVue,
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions(["setTronInstance"]),
  },
  created() {
    const tron = new TronWeb({
      fullHost: "https://api.shasta.trongrid.io",
    });

    this.setTronInstance(tron);
  },
  computed: {},
};
</script>

<style lang="scss"></style>
