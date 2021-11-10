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
    return {
      coinsToUSDIntervalID: null,
    };
  },
  methods: {
    ...mapActions(["setTronInstance", "setCoinsToUSD"]),
  },
  created() {
    const tron = new TronWeb({
      fullHost: "https://api.trongrid.io",
      solidityNode: "https://api.trongrid.io",
      eventServer: "https://api.trongrid.io",
    });

    this.setCoinsToUSD();
    this.coinsToUSDIntervalID = setInterval(() => {
      this.setCoinsToUSD();
    }, 600000);

    this.setTronInstance(tron);
    this.$store.commit("GET_WALLETS_FROM_LS");
  },
  beforeDestroy() {
    clearInterval(this.coinsToUSDIntervalID);
  },
  computed: {},
};
</script>

<style lang="scss"></style>
