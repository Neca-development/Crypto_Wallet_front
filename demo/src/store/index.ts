import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    wallets: [],
    Tron: null,
  },
  mutations: {
    ADD_WALLETS(state, wallets) {
      state.wallets = wallets;
    },
  },
  actions: {},
  getters: {
    Tron: (state) => state.Tron,
    wallets: (state) => state.wallets,
    // @ts-ignore
    getWalletByAddress: (state) => (address) => {
      // @ts-ignore
      return state.wallets.find((x) => x.address === address);
    },
  },
});
