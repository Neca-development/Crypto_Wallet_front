/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData, ITransaction } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";
import { IToken } from "../models/token";

import { tronGridApi, tronScanApi, tronWebProvider, coinConverterApi } from "../constants/providers";

// @ts-ignore
import TronWeb from "tronweb";
// @ts-ignore
import hdWallet from "tron-wallet-hd";
import axios from "axios";

export class tronService implements IChainService {
  Tron: any;

  constructor() {
    this.Tron = new TronWeb(tronWebProvider);
  }

  async createWallet(mnemonic: string): Promise<IWalletKeys> {
    const data: any = (await hdWallet.generateAccountsWithMnemonic(mnemonic, 1))[0];

    return {
      privateKey: data.privateKey,
      publicKey: data.address,
    };
  }

  async getTokensByAddress(address: string): Promise<IToken[]> {
    const { data } = await axios.get(`${tronScanApi}/account?address=${address}`);

    const { data: trxToUSD } = await axios.get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`);

    const tokens: IToken[] = data.tokens.map((x: any): IToken => {
      const tokenPriceInUSD = Math.trunc(x.tokenPriceInTrx * trxToUSD.tron.usd * 1000) / 1000;
      const balance = +this.Tron.fromSun(x.balance);
      const balanceInUSD =
        x.tokenAbbr.toLowerCase() === "usdt"
          ? Math.trunc(balance * 100) / 100
          : Math.trunc(balance * trxToUSD.tron.usd * 100) / 100;

      return {
        balance,
        balanceInUSD,
        tokenId: x.tokenId,
        contractAddress: x.tokenId,
        tokenAbbr: x.tokenAbbr,
        tokenName: x.tokenName,
        tokenType: x.tokenType,
        tokenLogo: x.tokenLogo,
        tokenPriceInUSD,
      };
    });

    return tokens;
  }

  async getFeePriceOracle(): Promise<IFee> {
    const { data: trxToUSD } = await axios.get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`);

    let value = "10";

    const usd = Math.trunc(+value * trxToUSD.tron.usd * 100) / 100;

    return {
      value,
      usd: usd.toString(),
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: trxToUSD } = await axios.get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`);
    const transactions = [];

    const trxTransactions = await this.getTrxTransactions(address, trxToUSD.tron.usd);

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
    this.Tron.setPrivateKey(data.privateKey);

    const address = this.Tron.address.toHex(data.receiverAddress);

    await this.Tron.trx.sendTransaction(address, this.Tron.toSun(data.amount), data.privateKey);
  }

  async send20Token(data: ISendingTransactionData) {
    this.Tron.setPrivateKey(data.privateKey);
    const contract = await this.Tron.contract().at(data.cotractAddress);
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

  /**
   * @param {string} address:string
   * @param {number} trxToUSD:number
   * @returns {Promise<ITransaction[]>}
   */
  private async getTrxTransactions(address: string, trxToUSD: number): Promise<ITransaction[]> {
    // get last 200  transactions
    const { data: transactions } = await axios.get(
      `${tronGridApi}/accounts/${address}/transactions?limit=200&fingerprint`
    );

    return transactions.data.map((transaction: any) => {
      return this.convertTransactionToCommonFormat(transaction, address, trxToUSD);
    });
  }

  /**
   * @param {string} address:string
   * @returns {Promise<ITransaction[]>}
   */
  private async getUSDTTransactions(address: string): Promise<ITransaction[]> {
    // get last 200  transactions
    const { data: transactions } = await axios.get(
      `${tronGridApi}/accounts/${address}/transactions/trc20?limit=200&fingerprint`
    );

    return transactions.data.map((transaction: any) => {
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
  private convertTransactionToCommonFormat(txData: any, address: string, trxToUSD: number): ITransaction {
    const to = this.Tron.address.fromHex(
      txData.raw_data.contract[0].parameter.value.to_address ||
        txData.raw_data.contract[0].parameter.value.contract_address
    );
    const from = this.Tron.address.fromHex(txData.raw_data.contract[0].parameter.value.owner_address);
    const type = txData.raw_data.contract[0].type;
    const amount = +this.Tron.fromSun(txData.raw_data.contract[0].parameter.value.amount);
    const direction = from === address ? "OUT" : "IN";
    const amountInUSD = Math.trunc(amount * trxToUSD * 100) / 100;

    return {
      to,
      from,
      amount,
      amountInUSD,
      txId: txData.txID,
      direction,
      type,
      tokenName: "TRX",
      timestamp: txData.block_timestamp,
      fee: 0,
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
    for (let i = 0; i < txData.token_info.decimals; i++) {
      decimal += "0";
    }

    const direction = txData.to === address ? "IN" : "OUT";

    return {
      to: txData.to,
      from: txData.from,
      amount: txData.value / +decimal,
      amountInUSD: txData.value / +decimal,
      txId: txData.transaction_id,
      direction,
      tokenName: txData.token_info.symbol,
      timestamp: txData.block_timestamp,
      fee: 8,
    };
  }
}
