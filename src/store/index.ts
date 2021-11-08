import { IBalance, IWallet } from "@/models/wallet";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    wallets: [] as IWallet[],
    Tron: null as any,
    coinsToUSD: null as any,
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
    async updateAllWalletsBalance({ commit, state, dispatch }) {
      await dispatch("setCoinsToUSD");
      const updatedWallets: IWallet[] = [];

      for await (const wallet of state.wallets) {
        const balance: IBalance = {
          coin: 0,
          usd: "0",
        };

        balance.coin = await state.Tron.trx.getBalance(wallet.address.base58);

        if (balance.coin) {
          balance.usd = (
            state.Tron.fromSun(balance.coin) * state.coinsToUSD.tron.usd
          ).toFixed(2);
        } else {
          balance.usd = "0";
        }

        updatedWallets.push({
          ...wallet,
          balance,
        });
      }

      commit("UPDATE_WALLETS_INFO", updatedWallets);
    },
    async updateWalletBalance({ commit, state, dispatch }, address) {
      await dispatch("setCoinsToUSD");
      const walletIdx = state.wallets.findIndex(
        (x) => x.address.base58 === address
      );
      const wallets: IWallet[] = JSON.parse(JSON.stringify(state.wallets));

      const balance: IBalance = {
        coin: 0,
        usd: "0",
      };

      balance.coin = await state.Tron.trx.getBalance(address);

      if (balance.coin) {
        balance.usd = (
          state.Tron.fromSun(balance.coin) * state.coinsToUSD.tron.usd
        ).toFixed(2);
      } else {
        balance.usd = "0";
      }

      wallets[walletIdx].balance = balance;

      commit("UPDATE_WALLETS_INFO", wallets);
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
  },
});
