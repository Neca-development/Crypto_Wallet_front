import { IWallet } from "@/models/wallet";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    wallets: [] as IWallet[],
    Tron: null as any,
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
  },
  actions: {
    addWallet({ commit }, wallet: IWallet) {
      commit("ADD_WALLET", wallet);
    },
    setTronInstance({ commit }, Tron) {
      commit("SET_TRON_INSTANCE", Tron);
    },
    async updateAllWalletsBalance({ commit, state }) {
      const updatedWallets: IWallet[] = [];

      for await (const wallet of state.wallets) {
        const balance = (await state.Tron.trx.getBalance(
          wallet.address.base58
        )) as string;

        updatedWallets.push({
          ...wallet,
          balance,
        });
      }

      commit("UPDATE_WALLETS_INFO", updatedWallets);
    },
    async updateWalletBalance({ commit, state }, address) {
      const walletIdx = state.wallets.findIndex(
        (x) => x.address.base58 === address
      );
      const wallets: IWallet[] = JSON.parse(JSON.stringify(state.wallets));

      wallets[walletIdx].balance = await state.Tron.trx.getBalance(address);

      commit("UPDATE_WALLETS_INFO", wallets);
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
