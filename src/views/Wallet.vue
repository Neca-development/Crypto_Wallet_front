<template>
  <div class="wallet-page">
    <section class="wallet-page__info">
      <h2 class="address">
        <span class="address__caption">Address</span>
        {{ wallet.address.base58 }}
        <vs-tooltip>
          <vs-button @click="copyAddress" class="address__copy" flat>
            <img src="@/assets/copy.png" alt="" />
          </vs-button>
          <template #tooltip> Copy address </template>
        </vs-tooltip>
      </h2>
      <vs-row justify="space-between">
        <div class="chain-info">
          <article class="currency">
            <img src="@/assets/tron.png" alt="" />
            <div>
              <span>TRX</span> <br />
              <b>Tron</b>
            </div>
          </article>
          <article class="balance">
            <b>{{ wallet.balance | convertToTRX }}</b>
          </article>
        </div>
        <vs-button
          class="private-key"
          :warn="!isPrvKeySuccessCopied"
          :success="isPrvKeySuccessCopied"
          border
          @click="copyPrivKeyToCb"
        >
          {{ isPrvKeySuccessCopied ? "✓ Copied" : "Copy private key" }}
        </vs-button>
      </vs-row>
    </section>

    <section class="wallet-page__send-trx">
      <form @submit.prevent="sendTrx">
        <h2 class="subtitle">Send TRX</h2>
        <vs-input
          class="input"
          label="To"
          name="receiver"
          placeholder="Receiver Address"
          v-model="sendTrxForm.receiver"
        ></vs-input>
        <br />
        <vs-input
          name="amount"
          class="input"
          label="Amount"
          placeholder="0.01"
          v-model="sendTrxForm.amount"
        ></vs-input>
        <div class="send-trx">
          <b v-if="isTrxSuccess">✓</b>
          <vs-button v-else gradient success> Send </vs-button>
        </div>
      </form>
    </section>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      isPrvKeySuccessCopied: false,
      sendTrxForm: {
        receiver: "",
        amount: "",
      },
      isTrxSuccess: false,
    };
  },
  computed: {
    ...mapGetters(["Tron"]),
    wallet() {
      const address = this.$route.params.address;
      console.log(address);
      return this.$store.getters.getWalletByAddress(address);
    },
  },
  filters: {
    convertToTRX(val) {
      return (val / 1000).toFixed(3);
    },
  },
  watch: {
    $route() {
      this.clearSendTrxForm();
      this.updateWalletBalance(this.wallet.address.base58);
    },
  },
  methods: {
    ...mapActions(["updateWalletBalance"]),
    copyAddress() {
      navigator.clipboard.writeText(this.wallet.address.base58).then(
        function () {
          console.log("Async: Copying to clipboard was successful!");
        },
        function (err) {
          console.error("Async: Could not copy text: ", err);
        }
      );
    },
    copyPrivKeyToCb() {
      navigator.clipboard.writeText(this.wallet.privateKey).then(
        () => {
          this.isPrvKeySuccessCopied = true;
          setTimeout(() => {
            this.isPrvKeySuccessCopied = false;
          }, 1000);
        },
        function (err) {
          console.error("Async: Could not copy text: ", err);
        }
      );
    },
    clearSendTrxForm() {
      this.sendTrxForm = {
        receiver: "",
        amount: "",
      };
    },
    async sendTrx(e) {
      this.Tron.setPrivateKey(this.wallet.privateKey);

      const address = this.Tron.address.toHex(this.sendTrxForm.receiver);
      try {
        await this.Tron.trx.sendTransaction(
          address,
          this.sendTrxForm.amount * 1000,
          this.wallet.privateKey
        );
        this.isTrxSuccess = true;
        setTimeout(() => {
          this.isTrxSuccess = false;
        }, 1000);
        this.$vs.notification({
          color: "success",
          title: "Success",
          position: "top-right",
          text: "Transaction was successfully sended",
        });
        this.clearSendTrxForm();
        this.updateWalletBalance(this.wallet.address.base58);
      } catch (error) {
        console.log(error);
        this.$vs.notification({
          color: "danger",
          title: "Error",
          position: "top-right",
          text: error,
        });
      }
    },
  },
};
</script>

<style lang="scss">
.wallet-page {
  &__info {
    background: #08080c;
    border-radius: 30px;
    color: #fff;
    padding: 2rem;
  }

  &__send-trx {
    background: #08080c;
    border-radius: 25px;
    color: #fff;
    padding: 1.5rem 2rem;
    margin-top: 2rem;
    display: inline-block;
    min-width: 24.75rem;
  }
}

.address {
  background: rgb(29, 29, 29);
  border: 0;
  border-radius: 25px;
  color: #fff;
  padding: 1.8rem 2rem 1rem;
  font-size: 2.5rem;
  font-weight: 400;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  &__caption {
    font-size: 0.8rem;
    position: absolute;
    left: 2rem;
    top: 10px;
    color: #a0a0a0;
  }

  &__copy {
    background: #000;
    padding: 0.5rem;
    border: none;
    border-radius: 15px;
    appearance: none;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: ease-in-out 0.18s;

    &:hover {
      transform: scale(1.1);
    }
  }
}
.currency {
  display: flex;
  font-size: 2rem;
  font-size: 1rem;

  img {
    height: 4rem;
    width: auto;
    margin-right: 0.5rem;
  }

  b {
    font-size: 1.7em;
  }
}

.balance {
  font-size: 3.5rem;
  line-height: 1;
  margin-left: 3rem;
}

.chain-info {
  display: flex;
  margin-top: 2rem;
  padding: 1.5rem 2rem;
}

.private-key {
  margin-left: auto;
  margin-top: 2rem;
  font-size: 1.2rem;
}

.subtitle {
  margin: 0;
  margin-bottom: 3rem;
}

.input {
  margin-bottom: 1.5rem;
  input {
    width: 100%;
    font-size: 1.2rem;

    &:focus {
      background: rgb(58, 53, 94);
    }
  }
  label {
    font-size: 0.8rem;
  }
}

.send-trx {
  font-size: 1rem;
  text-align: right;

  button {
    display: inline-block;
  }
}
</style>
