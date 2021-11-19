<template>
  <div class="wallet-page">
    <section class="wallet-page__info">
      <h2 class="address">
        <span class="address__caption">Address</span>
        {{ wallet.address }}
        <vs-tooltip>
          <vs-button @click="copyAddress" class="address__copy" flat>
            <img src="@/assets/copy.png" alt="" />
          </vs-button>
          <template #tooltip> Copy address </template>
        </vs-tooltip>
      </h2>
      <vs-row justify="space-between">
        <div class="chain-info">
          <h3 v-if="totalBalance">
            Total Balance:
            <small>
              <b>{{ totalBalance.trx }} TRX</b>
              (≈ {{ totalBalance.usd }} $)
            </small>
          </h3>
          <article v-for="(token, idx) of tokens" :key="idx" class="token">
            <div class="token__name">
              <img :src="token.tokenLogo" alt="" />
              <div>
                <abbr>{{ token.tokenAbbr }}</abbr> <br />
                <b>Tron</b>
              </div>
            </div>
            <table class="token__info">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th v-if="token.tokenAbbr !== 'trx'">1 Token to TRX</th>
                  <th v-if="token.tokenAbbr !== 'trx'">Total Sum in TRX</th>
                  <th>1 Coin to USD</th>
                  <th>Total Sum in USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ token.balance }}</td>
                  <td v-if="token.tokenAbbr !== 'trx'">
                    {{ token.tokenPriceInChainCoin.toFixed(6) }}
                  </td>
                  <td v-if="token.tokenAbbr !== 'trx'">
                    {{
                      (token.tokenPriceInChainCoin * token.balance).toFixed(6)
                    }}
                  </td>
                  <td>
                    {{ token.tokenPriceInUSD.toFixed(2) }}
                  </td>
                  <td>
                    {{ (token.tokenPriceInUSD * token.balance).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
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
    <div v-if="tokens" class="grid-row">
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
      <section class="wallet-page__send-trx">
        <form @submit.prevent="sendToken">
          <vs-row>
            <h2 class="subtitle">Send Token</h2>
            <vs-select
              class="token-selector"
              placeholder="Select Token"
              v-model="sendTokenForm.tokenAbbr"
            >
              <template #message-danger>
                {{ sendTokenForm.tokenAbbr ? "" : "Required" }}
              </template>
              <vs-option
                v-for="(token, idx) of $options.filters.filterTrc20Tokens(
                  tokens
                )"
                :key="idx"
                :label="token.tokenName"
                :value="token.tokenAbbr"
                class="token-selector__option"
              >
                <img
                  class="token-selector__logo"
                  :src="token.tokenLogo"
                  alt=""
                />
                {{ token.tokenName }}
              </vs-option>
            </vs-select>
          </vs-row>
          <vs-input
            class="input"
            label="To"
            name="receiver"
            placeholder="Receiver Address"
            v-model="sendTokenForm.receiver"
          >
            <template v-if="!sendTokenForm.receiver" #message-danger>
              Required
            </template>
          </vs-input>
          <br />
          <vs-input
            name="amount"
            class="input"
            label="Amount"
            placeholder="0.01"
            v-model="sendTokenForm.amount"
          >
            <template v-if="!sendTokenForm.amount" #message-danger>
              Required
            </template>
          </vs-input>
          <div class="send-trx">
            <b v-if="isTrxSuccess">✓</b>
            <vs-button
              :disabled="
                !sendTokenForm.tokenAbbr ||
                !sendTokenForm.receiver ||
                !sendTokenForm.amount
              "
              v-else
              gradient
              success
            >
              Send
            </vs-button>
          </div>
        </form>
      </section>
    </div>
    <section v-if="wallet" class="wallet-page__transactions">
      <h2 class="subtitle">Transactions History <small>(last 200)</small></h2>

      <vs-table>
        <template #thead>
          <vs-tr>
            <vs-th> Id </vs-th>
            <vs-th> In / Out </vs-th>
            <vs-th> Date </vs-th>
            <vs-th> Amount </vs-th>
            <vs-th> From </vs-th>
            <vs-th> To </vs-th>
            <vs-th> Satus </vs-th>
            <vs-th> Result </vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr
            :key="i"
            v-for="(tr, i) in $vs.getPage(
              transactions,
              transactionsPage,
              transactionsPerPage
            )"
            :data="tr"
          >
            <vs-td>
              {{ tr.txID | cropLongString }}
            </vs-td>
            <vs-td>
              {{
                tr.raw_data.contract[0].parameter.value.owner_address
                  | detectTransactionOwner(wallet.address.hex)
              }}
            </vs-td>
            <vs-td>
              <div class="max-content">
                {{ tr.raw_data.timestamp | convertToLocaleDateAndTime }}
              </div>
            </vs-td>
            <vs-td>
              {{
                tr.raw_data.contract[0].parameter.value.amount | convertToTRX
              }}
            </vs-td>
            <vs-td>
              <vs-tooltip color="#7d33ff" border-thick>
                {{
                  tr.raw_data.contract[0].parameter.value.owner_address
                    | cropLongString
                }}
                <template #tooltip>
                  {{ tr.raw_data.contract[0].parameter.value.owner_address }}
                </template>
              </vs-tooltip>
            </vs-td>
            <vs-td>
              {{
                tr.raw_data.contract[0].parameter.value.to_address ||
                tr.raw_data.contract[0].parameter.value.contract_address
                  | cropLongString
              }}
            </vs-td>
            <vs-td>
              <span
                class="status"
                :class="{ unconfirmed: tr.status === 'UNCONFIRMED' }"
              >
                {{ tr.status }}
              </span>
            </vs-td>
            <vs-td>
              <span
                v-if="tr.ret[0].contractRet === 'SUCCESS'"
                class="success-status"
              >
                <img
                  src="https://shasta.tronscan.org/static/media/Verified.cd1e3b6e.svg"
                  alt=""
                />
                SUCCESS
              </span>
              <span style="color: #f44" v-else>
                {{ tr.ret[0].contractRet }}</span
              >
            </vs-td>
          </vs-tr>
        </template>
        <template #footer>
          <vs-pagination
            v-model="transactionsPage"
            :length="$vs.getLength(transactions, transactionsPerPage)"
          />
        </template>
      </vs-table>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sendTrxForm: {
        receiver: "",
        amount: "",
      },
      sendTokenForm: {
        tokenAbbr: "",
        receiver: "",
        amount: "",
      },
      isPrvKeySuccessCopied: false,
      isTrxSuccess: false,
      updateInterval: null,
      transactions: [],
      transactionsPage: 1,
      transactionsPerPage: 8,
      tokens: null,
    };
  },
  computed: {
    wallet() {
      const address = this.$route.params.address;
      return this.$store.getters.getWalletByAddress(address);
    },
    totalBalance() {
      if (!this.tokens) {
        return null;
      }

      const totalBalance = {
        trx: 0,
        usd: 0,
      };

      totalBalance.trx = this.tokens.reduce((accum, token) => {
        return accum + +token.balance * token.tokenPriceInChainCoin;
      }, 0);

      totalBalance.trx = totalBalance.trx.toFixed(6);

      totalBalance.usd = (
        totalBalance.trx * this.tokens[0].tokenPriceInUSD
      ).toFixed(2);

      return totalBalance;
    },
  },
  filters: {
    convertToTRX(val) {
      return val / 10e6;
    },
    cropLongString(val) {
      if (!val || val.length < 16) {
        return val;
      }

      return val.substr(0, 8) + "..." + val.substr(-8, 8);
    },
    detectTransactionOwner(val, address) {
      if (val === address) {
        return "Out";
      }
      return "In";
    },
    convertToLocaleDateAndTime(timestamp) {
      return (
        new Date(timestamp).toLocaleDateString() +
        " " +
        new Date(timestamp).toLocaleTimeString()
      );
    },
    filterTrc20Tokens(tokens) {
      return tokens.filter((x) => x.tokenType === "trc20");
    },
  },
  watch: {
    $route() {
      this.updateWalletInfo();
      this.clearForms();

      this.transactionsPage = 1;
    },
    wallet() {
      this.updateWalletInfo();
    },
  },
  mounted() {
    this.updateWalletInfo();
    this.clearForms();

    this.updateInterval = setInterval(() => {
      this.updateWalletInfo();
    }, 30000);
  },
  beforeDestroy() {
    clearInterval(this.updateInterval);
  },
  methods: {
    copyAddress() {
      navigator.clipboard.writeText(this.wallet.address).then(
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
    clearSendTokenForm() {
      this.sendTokenForm = {
        tokenAbbr: "",
        receiver: "",
        amount: "",
      };
    },
    clearForms() {
      this.clearSendTrxForm();
      this.clearSendTokenForm();
    },
    updateWalletInfo() {
      this.getTransactions();
      this.getWalletTokens();
    },
    async getWalletTokens() {
      this.tokens = await this.wallet.getTokensByAddress();
    },
    async getTransactions() {
      this.transactions = await this.wallet.getTransactionsHistoryByAddress();
    },
    async sendTrx() {
      try {
        await this.wallet.sendMainToken({
          privateKey: this.wallet.privateKey,
          receiverAddress: this.sendTrxForm.receiver,
          amount: this.sendTrxForm.amount,
        });
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
    async sendToken() {
      const token = this.tokens.find(
          (x) => x.tokenAbbr === this.sendTokenForm.tokenAbbr
        ),
        receiverAddress = this.sendTokenForm.receiver,
        cotractAddress = token.contractAddress,
        amount = this.sendTokenForm.amount,
        privateKey = this.wallet.privateKey;

      try {
        await this.wallet.send20Token({
          receiverAddress,
          cotractAddress,
          amount,
          privateKey,
        });

        this.$vs.notification({
          color: "success",
          title: "Success",
          position: "top-right",
          text: "Token was successfully sended",
        });
        this.clearSendTokenForm();
      } catch (error) {
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
  &__info,
  &__transactions {
    background: #08080c;
    border-radius: 30px;
    color: #fff;
    padding: 2rem;
  }

  &__transactions {
    margin-top: 2rem;

    .vs-table-content {
      color: #fff;
    }
  }

  &__send-trx {
    background: #08080c;
    border-radius: 25px;
    color: #fff;
    padding: 1.5rem 2rem;
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
.token {
  margin-top: 2rem;
  display: flex;
  align-items: flex-end;

  &__name {
    display: flex;
    font-size: 2rem;
    font-size: 1rem;

    abbr {
      font-size: 0.9em;
      text-transform: uppercase;
    }

    img {
      height: 3.5rem;
      width: auto;
      margin-right: 0.5rem;
    }

    b {
      font-size: 1.5em;
    }
  }

  &__balance {
    font-size: 2rem;
    margin-left: 2rem;
  }

  &__info {
    border-collapse: collapse;
    margin-left: 2rem;

    td,
    th {
      width: max-content;
      border-right: 1px solid white;
      padding: 0.2rem 1rem;
      text-align: center;

      &:last-of-type {
        border-right: 0;
      }
    }

    th {
      border-bottom: 1px solid white;
    }
  }
}

.chain-info {
  margin-top: 2rem;
  padding: 1.5rem 2rem;

  h3 {
    font-size: 2.5rem;
    font-weight: 400;
    line-height: 1;
    margin: 0;
  }
}

.private-key {
  margin-left: auto;
  margin-top: 2rem;
  font-size: 1.2rem;
}

.subtitle {
  margin: 0;
  margin-bottom: 3rem;

  small {
    font-weight: 400;
    font-size: 0.5em;
  }
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

.success-status {
  display: inline-flex;
  align-items: center;

  img {
    margin-right: 0.3rem;
    height: 1rem;
  }
}

.status {
  color: green;

  &.unconfirmed {
    color: grey;
  }
}

.max-content {
  width: max-content;
}

.token-selector {
  margin-left: 2rem;
  &__logo {
    height: 30px;
    margin-right: 0.625rem;
  }
}

.vs-select__option {
  align-items: center;
  font-size: 0.7rem;
  text-transform: capitalize;
}

.vs-select__input {
  text-transform: capitalize;
  font-size: 1rem;
}

.grid-row {
  display: grid;
  margin-top: 2rem;
  gap: 40px;
  grid-template-columns: repeat(2, 1fr);
}
</style>
