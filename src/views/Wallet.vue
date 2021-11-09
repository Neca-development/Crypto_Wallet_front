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
            <b>{{ wallet.balance.usd }} $</b> <br />
            <small>{{ Tron.fromSun(wallet.balance.coin) }} TRX</small>
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
    <section v-if="wallet" class="wallet-page__transactions">
      <h2 class="subtitle">Transactions History</h2>

      <vs-table>
        <template #thead>
          <vs-tr>
            <vs-th> Id </vs-th>
            <vs-th> In / Out </vs-th>
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
              {{ tr.txID }}
            </vs-td>
            <vs-td>
              {{
                tr.raw_data.contract[0].parameter.value.owner_address
                  | detectTransactionOwner(wallet.address.hex)
              }}
            </vs-td>
            <vs-td>
              {{ Tron.fromSun(tr.raw_data.contract[0].parameter.value.amount) }}
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
    <vs-button @click="getTrcTokens">TRC-20</vs-button>
  </div>
</template>

<script>
import TronWeb from "tronweb";

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
      updateInterval: null,
      transactions: [],
      transactionsPage: 1,
      transactionsPerPage: 8,
    };
  },
  computed: {
    ...mapGetters(["Tron"]),
    wallet() {
      const address = this.$route.params.address;
      return this.$store.getters.getWalletByAddress(address);
    },
  },
  filters: {
    convertToTRX(val, Tron) {
      return Tron.fromSun(val);
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
  },
  watch: {
    $route() {
      this.updateWalletInfo();
      this.clearSendTrxForm();
      this.transactionsPage = 1;
    },
  },
  mounted() {
    this.updateWalletInfo();
    this.clearSendTrxForm();

    this.updateInterval = setInterval(() => {
      this.updateWalletInfo();
    }, 5000);
  },
  beforeDestroy() {
    clearInterval(this.updateInterval);
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
    updateWalletInfo() {
      this.updateWalletBalance(this.wallet.address.base58);
      this.getTransactions();
    },
    async getTrcTokens() {
      const HttpProvider = TronWeb.providers.HttpProvider;
      const fullNode = new HttpProvider("https://api.shasta.trongrid.io");
      const solidityNode = new HttpProvider("https://api.shasta.trongrid.io");
      const eventServer = new HttpProvider("https://api.shasta.trongrid.io");
      const privateKey = this.wallet.privateKey;
      const address = "TD53WjP3WKdBS9CvUpZZ97MciWRPmPt82X";
      const tronWeb = new TronWeb(
        fullNode,
        solidityNode,
        eventServer,
        privateKey
      );

      (async function triggerSmartContract() {
        const trc20ContractAddress = "TQQg4EL8o1BSeKJY4MJ8TB8XK7xufxFBvK"; //contract address

        try {
          let contract = await tronWeb.contract().at(trc20ContractAddress);
          //Use call to execute a pure or view smart contract method.
          // These methods do not modify the blockchain, do not cost anything to execute and are also not broadcasted to the network.
          let result = await contract.balanceOf(address).call();
          console.log("result: ", result);
        } catch (error) {
          console.error("trigger smart contract error", error);
        }
      })();
    },
    async getTransactions() {
      const transactions = [];
      let confirmedTransactions;
      let unconfirmedTransactions;

      await fetch(
        `https://api.shasta.trongrid.io/v1/accounts/${this.wallet.address.base58}/transactions?limit=200&only_confirmed=true`
      ).then((data) =>
        data.json().then(({ data }) => {
          confirmedTransactions = data.map((x) => {
            x.status = "CONFIRMED";
            return x;
          });
        })
      );

      await fetch(
        `https://api.shasta.trongrid.io/v1/accounts/${this.wallet.address.base58}/transactions?limit=200&only_unconfirmed=true`
      ).then((data) =>
        data.json().then(
          ({ data }) =>
            (unconfirmedTransactions = data.map((x) => {
              x.status = "UNCONFIRMED";
              return x;
            }))
        )
      );

      transactions.push(...unconfirmedTransactions, ...confirmedTransactions);

      this.transactions = transactions;
    },
    async sendTrx(e) {
      this.Tron.setPrivateKey(this.wallet.privateKey);

      const address = this.Tron.address.toHex(this.sendTrxForm.receiver);
      try {
        await this.Tron.trx.sendTransaction(
          address,
          this.Tron.toSun(this.sendTrxForm.amount),
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
</style>
