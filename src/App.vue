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
    ...mapActions(["setTronInstance", "updateAllWalletsBalance"]),
  },
  mounted() {
    console.log("created");
    const tron = new TronWeb({
      fullHost: "https://api.shasta.trongrid.io",
    });
    console.log(tron);

    this.setTronInstance(tron);
    this.$store.commit("GET_WALLETS_FROM_LS");
    this.updateAllWalletsBalance();
  },
  computed: {},
};
</script>

<style lang="scss"></style>
