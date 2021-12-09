<template>
  <div id="app">
    <app-sidebar></app-sidebar>
    <router-view />
  </div>
</template>
<script>
import SidebarVue from './components/Sidebar.vue';
import { mapActions } from 'vuex';
import { WalletFactory } from '../../lib/main';

export default {
  components: {
    'app-sidebar': SidebarVue,
  },
  data() {
    return {
      coinsToUSDIntervalID: null,
    };
  },
  methods: {
    ...mapActions(['setTronInstance', 'setCoinsToUSD']),
  },
  async created() {
    const wf = new WalletFactory();
    const data = await wf.createWallets('light afraid crawl solve chicken receive sound prize figure turn punch angry');
    const data1 = await wf.createWalletByPrivateKey(
      '86E4A2D8C28F5F448175500EA545E58372F26FEBB71F82EA268BA7FB382C7462',
      'Tron'
    );
    const data2 = await wf.createWalletByPrivateKey(
      'aafdd04dd28d1fed7ca6a2ea5ede0453d94a21336a5bee8998ac1255e6e60941',
      'Tron'
    );
    console.log({ data, data1, data2 });
    // this.$store.commit('ADD_WALLETS', [data1, data2]);
    this.$store.commit('ADD_WALLETS', data.wallets);
  },
  beforeDestroy() {
    clearInterval(this.coinsToUSDIntervalID);
  },
  computed: {},
};
</script>

<style lang="scss"></style>
