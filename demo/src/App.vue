<template>
  <div id="app">
    <app-sidebar></app-sidebar>
    <router-view />
  </div>
</template>
<script>
import SidebarVue from "./components/Sidebar.vue";
import { mapActions } from "vuex";
import { WalletFactory } from "../../lib/main";

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
  async created() {
    const wf = new WalletFactory();
    const wallets = await wf.createWallets(
      "light afraid crawl solve chicken receive sound prize figure turn punch angry"
    );

    this.$store.commit("ADD_WALLETS", wallets);
  },
  beforeDestroy() {
    clearInterval(this.coinsToUSDIntervalID);
  },
  computed: {},
};
</script>

<style lang="scss"></style>
