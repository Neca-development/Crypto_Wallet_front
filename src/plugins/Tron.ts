/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ISendingTransactionData } from "@/models/transactions";
// @ts-ignore
import TronWeb from "tronweb";
// @ts-ignore
import hdWallet from "tron-wallet-hd";

const Tron = new TronWeb({
  fullHost: "https://api.trongrid.io",
  solidityNode: "https://api.trongrid.io",
  eventServer: "https://api.trongrid.io",
});

export default {
  install(Vue: any): void {
    Vue.prototype.$Tron = {
      // return all tokens owned by address
      getWalletTokens: async (address: string) => {
        const { data } = await Vue.axios.get(
          `https://apilist.tronscan.org/api/account?address=${address}`
        );

        const seed =
          "vote feel bless host burger cash discover direct lyrics hidden organ service";
        const accounts = await hdWallet.generateAccountsWithMnemonic(seed, 2);
        console.log(
          "%cMyProject%cline:25%caccounts",
          "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
          "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
          "color:#fff;background:rgb(227, 160, 93);padding:3px;border-radius:2px",
          accounts
        );

        return data.tokens;
      },

      getTransactions: async (address: string) => {
        const transactions = [];
        let confirmedTransactions: any[] = [];
        let unconfirmedTransactions: any[] = [];

        // get last 200 confirmed transactions
        await Vue.axios
          .get(
            `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=200&only_confirmed=true&fingerprint`
          )
          .then(
            ({ data }: any) =>
              (confirmedTransactions = data.data.map((x: any) => {
                x.status = "CONFIRMED";
                return x;
              }))
          );

        // get up to 200 last uncofirmed transactions
        await Vue.axios(
          `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=200&only_unconfirmed=true`
        ).then(
          ({ data }: any) =>
            (unconfirmedTransactions = data.data.map((x: any) => {
              x.status = "UNCONFIRMED";
              return x;
            }))
        );

        transactions.push(...unconfirmedTransactions, ...confirmedTransactions);

        return transactions;
      },

      sendTrx: async (data: ISendingTransactionData) => {
        Tron.setPrivateKey(data.privateKey);

        const address = Tron.address.toHex(data.receiverAddress);

        await Tron.trx.sendTransaction(
          address,
          Tron.toSun(data.amount),
          data.privateKey
        );
      },

      sendTRC20Token: async (data: ISendingTransactionData) => {
        Tron.setPrivateKey(data.privateKey);

        const contract = await Tron.contract().at(data.cotractAddress);
        console.log(data);
        //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
        // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
        await contract
          .transfer(
            data.receiverAddress, //address _to
            Tron.toSun(data.amount) //amount
          )
          .send({
            feeLimit: 10000000,
          });
      },

      getTokenContractAddress(tokens: any[], tokenAbbr: string) {
        const token = tokens.find((x: any) => x.tokenAbbr === tokenAbbr);

        return token.tokenId;
      },
    };
  },
};
