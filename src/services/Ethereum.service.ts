/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ISendingTransactionData } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";
import { ITransaction } from "../models/transaction";

import {
  etherScanApi,
  etherScanApiKey,
  web3Provider,
  coinConverterApi,
  etherUSDTContractAddress,
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

    const { data: ethToUSD } = await axios.get(
      `${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`
    );

    const { data: mainToken } = await axios.get(
      `${etherScanApi}?module=account&action=balance&address=${address}&tag=latest&apikey=${etherScanApiKey}`
    );

    const mainTokenBalanceInUSD =
      Math.trunc(this.web3.utils.fromWei(mainToken.result) * ethToUSD.ethereum.usd * 100) / 100;

    tokens.push({
      balance: this.web3.utils.fromWei(mainToken.result),
      balanceInUSD: mainTokenBalanceInUSD,
      tokenId: "_",
      contractAddress: "_",
      tokenAbbr: "ETH",
      tokenName: "ETH",
      tokenType: "mainToken",
      tokenLogo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
      tokenPriceInUSD: ethToUSD.ethereum.usd,
    });

    const { data: USDT } = await axios.get(
      `${etherScanApi}?module=account&action=tokenbalance&contractaddress=${etherUSDTContractAddress}&address=${address}&tag=latest&apikey=${etherScanApiKey}`
    );

    const USDTDecimal = 1e6;
    const USDTbalanceInUSD = Math.trunc((USDT.result / USDTDecimal) * 100) / 100;

    tokens.push({
      balance: USDT.result / USDTDecimal,
      balanceInUSD: USDTbalanceInUSD,
      tokenId: "_",
      contractAddress: "_",
      tokenAbbr: "USDT",
      tokenName: "USD Tether",
      tokenType: "smartToken",
      tokenLogo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
      tokenPriceInUSD: 1,
    });

    return tokens;
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    address = address.toLowerCase();
    const { data: ethToUSD } = await axios.get(
      `${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`
    );

    const transactions = [];

    const trxTransactions = await this.getNormalTransactions(address, ethToUSD.ethereum.usd);

    const usdtTransactions = await this.getUSDTTransactions(address);

    transactions.push(...trxTransactions, ...usdtTransactions);

    transactions.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return -1;
      } else if (a.timestamp < b.timestamp) {
        return 1;
      } else {
        return 0;
      }
    });

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

  /**
   * @param {string} address:string
   * @param {number} ethToUSD:number
   * @returns {Promise<ITransaction[]>}
   */
  private async getNormalTransactions(address: string, ethToUSD: number): Promise<ITransaction[]> {
    // get last 200  transactions

    const { data: transactions } = await axios.get(
      `${etherScanApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`
    );

    return transactions.result.map((transaction: any) => {
      return this.convertTransactionToCommonFormat(transaction, address, ethToUSD);
    });
  }

  /**
   * @param {string} address:string
   * @returns {Promise<ITransaction[]>}
   */
  private async getUSDTTransactions(address: string): Promise<ITransaction[]> {
    const { data: transactions } = await axios.get(
      `${etherScanApi}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`
    );

    return transactions.result.map((transaction: any) => {
      return this.convertUSDTTransactionToCommonFormat(transaction, address);
    });
  }

  /**
   * 描述
   * @date 2021-11-20
   * @param {any} txData:any
   * @param {string} address:string
   * @param {number} trxToUSD:number
   * @returns {ITransaction}
   */
  private convertTransactionToCommonFormat(txData: any, address: string, ethToUSD: number): ITransaction {
    const to = txData.to,
      from = txData.from,
      amount = +this.web3.utils.fromWei(txData.value),
      fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6),
      direction = from === address ? "OUT" : "IN",
      amountInUSD = Math.trunc(amount * ethToUSD * 100) / 100;

    return {
      to,
      from,
      amount,
      amountInUSD,
      txId: txData.hash,
      direction,
      tokenName: "ETH",
      timestamp: +txData.timeStamp,
      fee,
    };
  }

  /**
   * @param {any} txData:any
   * @param {string} address:string
   * @param {number} trxToUSD:number
   * @returns {ITransaction}
   */
  private convertUSDTTransactionToCommonFormat(txData: any, address: string): ITransaction {
    let decimal = "1";
    for (let i = 0; i < txData.tokenDecimal; i++) {
      decimal += "0";
    }

    const to = txData.to,
      from = txData.from,
      amount = txData.value / +decimal,
      fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6),
      direction = from === address ? "OUT" : "IN";

    return {
      to,
      from,
      amount,
      amountInUSD: amount,
      txId: txData.hash,
      direction,
      tokenName: txData.tokenSymbol,
      timestamp: +txData.timeStamp,
      fee,
    };
  }
}
