<template>
  <vs-sidebar class="sidebar" fixed open v-model="activeWallet">
    <template #header><h2>Your Wallets</h2></template>
    <template v-if="wallets.length">
      <vs-sidebar-item
        v-for="wallet in wallets"
        :id="wallet.address.base58"
        :key="wallet.publicKey"
      >
        <router-link
          class="link"
          :to="{ name: 'Wallet', params: { address: wallet.address.base58 } }"
        >
          <div class="wallet">
            <img src="@/assets/tron.png" alt="" />
            <div class="wallet__txt">
              <b class="wallet__title">Tron</b> <br />
              {{ wallet.address.base58 }}
            </div>
          </div>
        </router-link>
      </vs-sidebar-item>
    </template>
    <h3 class="wallets-placeholder" v-else>Create or add wallet to begin</h3>
    <template #footer>
      <vs-row justify="space-between">
        <vs-button @click="openNewWalletPopup" gradient class="new-wallet-btn">
          ⨭ Add wallet
        </vs-button>
        <vs-dialog class="new-wallet-modal" v-model="isNewWalletPopupOpen">
          <template #header>
            <vs-button-group>
              <vs-button
                @click="selectNewWalletTab('create')"
                :active="newWalletActiveTab === 'create'"
                flat
                border
                icon
              >
                Create New Wallet
              </vs-button>
              <vs-button
                @click="selectNewWalletTab('import')"
                :active="newWalletActiveTab === 'import'"
                flat
                border
                icon
              >
                Import Wallet
              </vs-button>
            </vs-button-group>
          </template>
          <div v-if="newWalletActiveTab === 'create'">
            <vs-row align="center">
              <vs-select placeholder="Select CUR" v-model="newWalletCurrency">
                <vs-option label="TRX" value="TRX"> TRX </vs-option>
              </vs-select>
              <vs-button
                @click="createWallet"
                class="create-new-btn"
                flat
                gradient
              >
                Create New Wallet
              </vs-button>
            </vs-row>
          </div>
          <div class="tab-content" v-if="newWalletActiveTab === 'import'">
            <form @submit.prevent="importWallet">
              <vs-input
                v-model="prvKeyInput"
                placeholder="Enter your prv key"
                class="import-input"
              />
              <vs-button
                :disabled="!Tron || !prvKeyInput"
                gradient
                class="import-btn"
              >
                + Import TRON wallet
              </vs-button>
            </form>
          </div>
        </vs-dialog>
      </vs-row>
    </template>
  </vs-sidebar>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      prvKeyInput: "",
      isNewWalletPopupOpen: false,
      newWalletActiveTab: "create",
      newWalletCurrency: "",
      activeWallet: null,
    };
  },
  computed: {
    ...mapGetters(["Tron", "wallets"]),
  },
  mounted() {
    const address = this.$route.params.address;

    if (address) {
      this.activeWallet = address;
    }
  },
  methods: {
    ...mapActions(["addWallet"]),
    openNewWalletPopup() {
      this.isNewWalletPopupOpen = true;
    },
    closeNewWalletPopup() {
      this.isNewWalletPopupOpen = false;
    },
    async createWallet() {
      const wallet = await this.Tron.createAccount();
      wallet.balance = await this.Tron.trx.getBalance(wallet.address.base58);

      this.addWallet(wallet);
      this.closeNewWalletPopup();
    },

    selectNewWalletTab(title) {
      this.newWalletActiveTab = title;
    },

    async importWallet() {
      const wallet = {
        privateKey: this.prvKeyInput,
      };

      await this.Tron.setPrivateKey(this.prvKeyInput);
      wallet.address = this.Tron.defaultAddress;
      wallet.balance = await this.Tron.trx.getBalance(wallet.address.base58);

      this.addWallet(wallet);
      this.prvKeyInput = "";
      this.closeNewWalletPopup();
    },
  },
};
</script>

<style lang="scss">
.tab-content {
  margin-top: 1rem;
}

.new-wallet-btn {
  font-size: 1.4rem;
  padding: 0 1rem;
}

.create-new-btn {
  margin: 1.5rem;
}

.import-btn {
  margin-left: auto;
  margin-top: 1rem;
}

.import-input {
  input {
    width: 100%;
  }
}

.wallets-placeholder {
  padding: 2rem;
  opacity: 0.5;
  font-size: 2.5rem;
}

.wallet {
  display: flex;
  text-decoration: none;

  img {
    height: 36px;
  }

  &__txt {
    margin-left: 1rem;
    font-weight: 400;
    font-size: 1.1rem;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.link {
  text-decoration: none;
  color: inherit;
}

.sidebar {
  background: linear-gradient(
    307deg,
    rgba(25, 91, 255, 0) 17%,
    rgb(9, 36, 105) 100%
  );

  .vs-sidebar__item {
    padding: 0;

    a {
      display: block;
      padding: 18px 16px 18px 25px;
    }

    &:after {
      background: #fff;
    }

    &:hover {
      padding-left: 0;
    }

    &.active {
      color: #fff;
      padding-left: 10px;
    }
  }
}

.new-wallet-modal {
  * {
    font-size: 1.2rem;
  }
}
</style>
