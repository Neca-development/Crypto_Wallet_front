<template>
  <div id="app">
    <app-sidebar></app-sidebar>
    <router-view />
  </div>
</template>
<script>
import SidebarVue from './components/Sidebar.vue';
import { mapActions } from 'vuex';
import { WalletFactory } from '../../build/sdk.js';

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
    // const data1 = await wf.createWalletByPrivateKey('L2iTaRMzSK7cqzXQgivYLP7o1me5WpPhqr9wJysYQkfwT4QEDwpb', 'Bitcoincash');
    // const data2 = await wf.createWalletByPrivateKey('cS6Xqxi3ijJEzhTtnLgvMqbik9LwBNiWkQigT7QApLuo7XjrDYXK', 'Bitcoin');
    // this.$store.commit('ADD_WALLETS', [data1, data2]);
    this.$store.commit('ADD_WALLETS', data.wallets);
    console.log(await wf.getAllTokens());
  },
  beforeDestroy() {
    clearInterval(this.coinsToUSDIntervalID);
  },
  computed: {},
};
</script>

<style lang="scss"></style>
