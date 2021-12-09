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
    // const data = await wf.createWallets('light afraid crawl solve chicken receive sound prize figure turn punch angry');
    const data1 = await wf.createWalletByPrivateKey(
      '91979cd28d855231ff46f52280d375a8f598aab1ce81814030ed182b4e796827',
      'Tron'
    );
    const data2 = await wf.createWalletByPrivateKey(
      '9e654f4bf0eb90b1cab13e405d5379219e5cff23c6f720ede03fcecba76f1010',
      'Tron'
    );
    // console.log(data);
    this.$store.commit('ADD_WALLETS', [data1, data2]);
  },
  beforeDestroy() {
    clearInterval(this.coinsToUSDIntervalID);
  },
  computed: {},
};
</script>

<style lang="scss"></style>
