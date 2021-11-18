/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ISendingTransactionData, ITransaction } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";

import { tronWebProviders } from "../constants/providers";

// @ts-ignore
import TronWeb from "tronweb";
// @ts-ignore
import hdWallet from "tron-wallet-hd";
import axios from "axios";
import { IToken } from "../models/token";

export class tronService implements IChainService {
  Tron: any;

  constructor() {
    this.Tron = new TronWeb(tronWebProviders);
  }

  async createWallet(mnemonic: string): Promise<IWalletKeys> {
    const data: any = (
      await hdWallet.generateAccountsWithMnemonic(mnemonic, 1)
    )[0];

    return {
      privateKey: data.privateKey,
      publicKey: data.address,
    };
  }

  async getTokensByAddress(address: string): Promise<IToken[]> {
    const { data } = await axios.get(
      `https://apilist.tronscan.org/api/account?address=${address}`
    );

    const trxToUSD = await axios
      .get(
        "https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd"
      )
      .then(({ data }) => data.tron.usd);

    const tokens: IToken[] = data.tokens.map((x: any): IToken => {
      return {
        balance: this.Tron.fromSun(x.balance),
        tokenId: x.tokenId,
        contractAddress: x.tokenId,
        tokenAbbr: x.tokenAbbr,
        tokenName: x.tokenName,
        tokenType: x.tokenType,
        tokenLogo: x.tokenLogo,
        tokenPriceInChainCoin: x.tokenPriceInTrx,
        tokenPriceInUSD: +x.tokenPriceInTrx * trxToUSD,
      };
    });

    return tokens;
  }

  async getTransactionsHistoryByAddress(
    address: string
  ): Promise<ITransaction[]> {
    const transactions = [];
    let confirmedTransactions: any[] = [];
    let unconfirmedTransactions: any[] = [];

    // get last 200 confirmed transactions
    await axios
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
    await axios(
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
  }

  async sendMainToken(data: ISendingTransactionData) {
    this.Tron.setPrivateKey(data.privateKey);

    const address = this.Tron.address.toHex(data.receiverAddress);

    await this.Tron.trx.sendTransaction(
      address,
      this.Tron.toSun(data.amount),
      data.privateKey
    );
  }

  async send20Token(data: ISendingTransactionData) {
    this.Tron.setPrivateKey(data.privateKey);

    const contract = await this.Tron.contract().at(data.cotractAddress);
    console.log(data);
    //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
    // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
    await contract
      .transfer(
        data.receiverAddress, //address _to
        this.Tron.toSun(data.amount) //amount
      )
      .send({
        feeLimit: 10000000,
      });
  }

  getTokenContractAddress(tokens: any[], tokenAbbr: string) {
    const token = tokens.find((x: any) => x.tokenAbbr === tokenAbbr);

    return token.tokenId;
  }
}
