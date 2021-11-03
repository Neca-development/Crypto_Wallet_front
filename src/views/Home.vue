<template>
  <div class="home">
    <aside class="sidebar">
      <div class="sidebar__sticky">
        <form @submit.prevent="importWallet">
          <vs-input
            v-model="prvKeyInput"
            label="Connect existed wallet"
            placeholder="Enter your prv key"
          />
          <vs-button :disabled="!Tron || !prvKeyInput" gradient class="button">
            + Import TRON wallet
          </vs-button>
        </form>

        <vs-button @click="createWallet" warn gradient class="new-wallet">
          Create New Wallet
        </vs-button>
      </div>
    </aside>
    <div class="wallets">
      <article class="wallet" v-for="wallet in wallets" :key="wallet.publicKey">
        <div>
          <b>Address: </b> {{ wallet.address.base58 }} <br />
          <b>Private key: </b> {{ wallet.privateKey }} <br />
        </div>
        <div class="wallet__balance">{{ wallet.balance }} <b> TRX</b></div>
      </article>
    </div>
  </div>
</template>

<script>
import TronWeb from "tronweb";

export default {
  data() {
    return {
      Tron: null,
      wallets: [],
      prvKeyInput: "",
    };
  },
  created() {
    this.Tron = new TronWeb({
      fullHost: "https://api.shasta.trongrid.io",
    });
  },
  computed: {},
  methods: {
    async createWallet() {
      const wallet = await this.Tron.createAccount();
      wallet.balance = await this.Tron.trx.getBalance(wallet.address.base58);
      this.wallets.push(wallet);
    },

    async importWallet() {
      const wallet = {
        privateKey: this.prvKeyInput,
      };

      await this.Tron.setPrivateKey(this.prvKeyInput);
      wallet.address = this.Tron.defaultAddress;
      wallet.balance = await this.Tron.trx.getBalance(wallet.address.base58);

      this.wallets.push(wallet);
    },
  },
};
</script>

<style lang="scss">
.home {
  display: flex;
  align-items: start;
  gap: 2.5rem;
  height: 100vh;
}

.sidebar {
  background: #fff;
  border-radius: 0 20px 20px 0;
  height: 100%;
  padding: 4rem 1rem;
  min-width: 18.75rem;

  &__sticky {
    top: 1.25rem;
    position: sticky;

    input {
      width: 100%;
    }

    label {
      font-size: 0.9rem;
    }

    .button {
      margin-top: 20px;
      margin-left: auto;
    }
  }
}

.wallets {
  padding: 2.1875rem 0;
  max-height: 100%;
  overflow: auto;
  flex: 1;
}

.wallet {
  padding: 1rem 1.5rem;
  background: #fff;
  border-radius: 1.25rem;
  color: #555555;
  margin-bottom: 1.5625rem;
  display: inline-flex;
  cursor: pointer;

  &__balance {
    margin-left: 1.25rem;
    padding-left: 1.25rem;
    border-left: 2px solid rgb(90, 90, 90);
    border-radius: 2px;
    font-size: 1.6rem;
  }
}

button.new-wallet {
  margin: auto;
  margin-top: 2.5625rem;
  font-size: 1.5rem;
  border-radius: 0.9375rem;
  padding: 0 1rem;
}
</style>
