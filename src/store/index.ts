import { IWallet } from "@/models/wallet";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    wallets: [] as IWallet[],
    Tron: null,
  },
  mutations: {
    ADD_WALLET(state, wallet) {
      state.wallets.push(wallet);
    },
    SET_TRON_INSTANCE(state, Tron) {
      state.Tron = Tron;
    },
  },
  actions: {
    addWallet({ commit }, wallet: IWallet) {
      commit("ADD_WALLET", wallet);
    },
    setTronInstance({ commit }, Tron) {
      commit("SET_TRON_INSTANCE", Tron);
    },
  },
  getters: {
    Tron: (state) => state.Tron,
    wallets: (state) => state.wallets,
    getWalletByAddress: (state) => (address: string) => {
      return state.wallets.find((x) => x.address.base58 === address);
    },
  },
});
