/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ISendingTransactionData } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";

import {
  etherScanApi,
  etherScanApiKey,
  web3Provider,
  coinConverterApi,
} from "../constants/providers";

// @ts-ignore
import axios from "axios";
import Web3 from "web3";
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ethers } from "ethers";
import { IToken } from "../models/token";

export class ethereumService implements IChainService {
  private web3: any;

  constructor() {
    this.web3 = new Web3(web3Provider);
  }

  async createWallet(mnemonic: string): Promise<IWalletKeys> {
    const data = ethers.Wallet.fromMnemonic(mnemonic);

    return {
      privateKey: data.privateKey,
      publicKey: data.address,
    };
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];

    const ethToUSD = await axios
      .get(`${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd`)
      .then(({ data }) => data.eth.usd);

    const { data: mainToken } = await axios.get(
      `${etherScanApi}?module=account&action=balance&address=${address}&tag=latest&apikey=${etherScanApiKey}`
    );

    mainToken.push({
      balance: mainToken.result,
      tokenId: "_",
      contractAddress: "_",
      tokenAbbr: "ETH",
      tokenName: "ETH",
      tokenType: "eth",
      tokenPriceInChainCoin: "1",
      tokenPriceInUSD: ethToUSD,
    });

    return tokens;
  }

  async getTransactionsHistoryByAddress(address: string) {
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
    console.log(data);

    // this.Tron.setPrivateKey(data.privateKey);
    // const address = this.Tron.address.toHex(data.receiverAddress);
    // await this.Tron.trx.sendTransaction(
    //   address,
    //   this.Tron.toSun(data.amount),
    //   data.privateKey
    // );
  }

  async send20Token(data: ISendingTransactionData) {
    console.log(data);

    // this.Tron.setPrivateKey(data.privateKey);
    // const contract = await this.Tron.contract().at(data.cotractAddress);
    // console.log(data);
    // //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
    // // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
    // await contract
    //   .transfer(
    //     data.receiverAddress, //address _to
    //     this.Tron.toSun(data.amount) //amount
    //   )
    //   .send({
    //     feeLimit: 10000000,
    //   });
  }

  getTokenContractAddress(tokens: any[], tokenAbbr: string) {
    const token = tokens.find((x: any) => x.tokenAbbr === tokenAbbr);

    return token.tokenId;
  }
}
