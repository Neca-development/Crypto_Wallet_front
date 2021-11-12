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
      <vs-row justify="space-between" align="stretch">
        <vs-button @click="openBackupModal" gradient class="new-wallet-btn">
          ⨭ Add wallet
        </vs-button>
        <vs-button @click="openBackupModal" class="backup-btn" warn gradient>
          💾
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
        <vs-dialog v-model="isBackupModalOpen">
          <template #header>
            <h4>
              This wallet makes it easy to access your crypto and interact with
              blockchain. We does not have access to your funds.
            </h4>
          </template>
          <vs-row>
            <vs-input
              type="password"
              icon-after
              v-model="secretKey"
              placeholder="Password"
              label="Enter your decrypt/encrypt secret key"
              class="secret-key"
            >
              <template #icon> 🔒 </template>
            </vs-input>
          </vs-row>
          <vs-row>
            <vs-button
              gradient
              success
              :disabled="!secretKey"
              @click="downloadBackup"
              >Download backup ⭳</vs-button
            >
            <vs-button
              gradient
              warn
              :disabled="!secretKey"
              @click="uploadBackup"
              >Upload backup ⭱</vs-button
            >
          </vs-row>
        </vs-dialog>
      </vs-row>
    </template>
  </vs-sidebar>
</template>

<script>
import CryptoJS from "crypto-js";

import { mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      prvKeyInput: "",

      isNewWalletPopupOpen: false,
      isBackupModalOpen: false,

      newWalletActiveTab: "create",
      newWalletCurrency: "",
      activeWallet: null,
      secretKey: "",
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
    openBackupModal() {
      this.isBackupModalOpen = true;
    },
    closeBackupModal() {
      this.isBackupModalOpen = false;
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

    downloadBackup() {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(this.wallets),
        this.secretKey
      );

      this.downloadAsFile(encrypted.formatter.stringify(encrypted));
    },

    async uploadBackup() {
      const file = await this.getFileFromUserDevice();
      const data = await this.getDataFromFile(file);

      const wallets = this.dectyptFile(data);

      this.$store.commit("UPDATE_WALLETS_INFO", wallets);
      this.isBackupModalOpen = false;
    },

    getFileFromUserDevice() {
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");

        input.type = "file";
        input.accept = ".txt";
        input.addEventListener("change", () => {
          if (input.files[0]) {
            resolve(input.files[0]);
          } else {
            this.$vs.notification({
              color: "danger",
              title: "Error",
              position: "top-right",
              text: "Select backup file to restore data",
            });
            reject("error");
          }
        });

        input.click();
      });
    },

    getDataFromFile(file) {
      return new Promise((resolve, reject) => {
        var fr = new FileReader();

        fr.onload = (e) => {
          resolve(e.target.result);
        };

        fr.readAsText(file);
      });
    },

    dectyptFile(data) {
      try {
        const decrypted = CryptoJS.AES.decrypt(data, this.secretKey);
        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      } catch (error) {
        this.$vs.notification({
          color: "danger",
          title: "Error",
          position: "top-right",
          text: "Invalid secret key",
        });
      }
    },

    downloadAsFile(data) {
      const a = document.createElement("a");
      const file = new Blob([data], { type: "application/json" });
      a.href = URL.createObjectURL(file);
      a.download = `backup${new Date().toLocaleString()}.txt`;
      a.click();
    },

    async importWallet() {
      const wallet = {
        privateKey: this.prvKeyInput,
      };

      await this.Tron.setPrivateKey(this.prvKeyInput);
      wallet.address = this.Tron.defaultAddress;
      wallet.balance = {};

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
  max-width: 18rem;

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

.backup-btn {
  width: 3rem;
  font-size: 1.2rem;
}

.secret-key {
  width: 18rem;
  margin: 1.5625rem 0;
  input {
    width: 100%;
  }
}
</style>
