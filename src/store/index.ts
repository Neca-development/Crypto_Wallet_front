import { IWallet } from "@/models/wallet";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    wallets: [] as IWallet[],
    Tron: null as unknown,
    coinsToUSD: null as unknown,
  },
  mutations: {
    ADD_WALLET(state, wallet) {
      state.wallets.push(wallet);
      localStorage.setItem("wallets", JSON.stringify(state.wallets));
    },
    SET_TRON_INSTANCE(state, Tron) {
      state.Tron = Tron;
    },
    GET_WALLETS_FROM_LS(state) {
      const localWallets = JSON.parse(
        localStorage.getItem("wallets") as string
      );

      if (localWallets) {
        state.wallets = localWallets;
      }
    },
    UPDATE_WALLETS_INFO(state, wallets) {
      state.wallets = wallets;
      localStorage.setItem("wallets", JSON.stringify(state.wallets));
    },
    SET_COINS_TO_USD(state, value) {
      state.coinsToUSD = value;
    },
  },
  actions: {
    addWallet({ commit }, wallet: IWallet) {
      commit("ADD_WALLET", wallet);
    },
    setTronInstance({ commit }, Tron) {
      commit("SET_TRON_INSTANCE", Tron);
    },
    async setCoinsToUSD({ commit }) {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd"
      );

      const val = await resp.json();

      commit("SET_COINS_TO_USD", val);
    },
  },
  getters: {
    Tron: (state) => state.Tron,
    wallets: (state) => state.wallets,
    getWalletByAddress: (state) => (address: string) => {
      return state.wallets.find((x) => x.address.base58 === address);
    },
    coinsCostInUSDT: (state) => state.coinsToUSD,
  },
});
