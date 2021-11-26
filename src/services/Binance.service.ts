/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { IToken } from '../models/token';

import { getBNFromDecimal, removeTrailingZeros } from '../utils/numbers';

import { etherScanApiKey, coinConverterApi, binanceScanApi } from '../constants/providers';
import { binanceWeb3Provider, binanceUSDTContractAddress } from '../constants/providers';
import { bnbUSDTAbi } from '../constants/bnb-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
export class binanceService implements IChainService {
  private web3: Web3;

  constructor() {
    this.web3 = new Web3(binanceWeb3Provider);
  }

  async createKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    this.web3.eth.accounts.wallet.add(this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey));
    this.web3.eth.defaultAccount = wallet.address;

    return {
      privateKey: wallet.privateKey,
      publicKey: wallet.address,
    };
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    const nativeToken = this.web3.utils.fromWei(await this.web3.eth.getBalance(address));

    const { data: bnbToUSD } = await axios.get(
      `${coinConverterApi}/v3/simple/price?ids=binancecoin&vs_currencies=usd,tether`
    );

    const mainTokenBalanceInUSD = Math.trunc(+nativeToken * bnbToUSD.binancecoin.usd * 100) / 100;

    tokens.push({
      balance: +nativeToken,
      balanceInUSD: mainTokenBalanceInUSD,
      tokenId: '_',
      contractAddress: '_',
      tokenAbbr: 'BNB',
      tokenName: 'Binance Coin',
      tokenType: 'mainToken',
      tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
      tokenPriceInUSD: bnbToUSD.binancecoin.usd,
    });

    const contract = new this.web3.eth.Contract(bnbUSDTAbi as any, binanceUSDTContractAddress);
    const result = await contract.methods.balanceOf(address).call();

    const decimals = getBNFromDecimal(parseInt(await contract.methods._decimals().call(), 10));
    const balance = new BigNumber(result).div(decimals).toNumber();
    const USDTbalanceInUSD = Math.trunc(balance * 100) / 100;

    tokens.push({
      balance,
      balanceInUSD: USDTbalanceInUSD,
      tokenId: '_',
      contractAddress: binanceUSDTContractAddress,
      tokenAbbr: 'USDT',
      tokenName: 'USD Tether',
      tokenType: 'smartToken',
      tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      tokenPriceInUSD: 1,
    });

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string): Promise<IFee> {
    const { data: ethToUSD } = await axios.get(
      `${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`
    );

    const fee = await this.web3.eth.estimateGas({
      from,
      to,
    });

    let value = await this.web3.eth.getGasPrice();
    value = (+this.web3.utils.fromWei(value) * fee).toString();

    const usd = Math.trunc(+value * ethToUSD.ethereum.usd * 100) / 100;

    return {
      value,
      usd: usd.toString(),
    };
  }

  /**
   * @param {ISendingTransactionData} data:ISendingTransactionData
   * @returns {any}
   */
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
    const gasPrice = await this.web3.eth.getGasPrice();
    const gasCount = Math.trunc(+this.web3.utils.toWei(data.fee) / +gasPrice);

    const result = await this.web3.eth.sendTransaction({
      from: this.web3.eth.defaultAccount,
      to: data.receiverAddress,
      value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
      gasPrice: gasPrice,
      gas: gasCount,
    });
    console.log(result);
  }

  async send20Token(data: ISendingTransactionData) {
    const tokenAddress = data.cotractAddress;
    const contract = new this.web3.eth.Contract(bnbUSDTAbi as any, tokenAddress);
    const decimals = getBNFromDecimal(+(await contract.methods._decimals().call()));
    const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
    const result = await contract.methods
      .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
      .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
    console.log(result);
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
      `${binanceScanApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`
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
      `${binanceScanApi}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`
    );

    return transactions.result.map((transaction: any) => {
      return this.convertUSDTTransactionToCommonFormat(transaction, address);
    });
  }

  /**
   * @param {any} txData:any
   * @param {string} address:string
   * @param {number} trxToUSD:number
   * @returns {ITransaction}
   */
  private convertTransactionToCommonFormat(txData: any, address: string, ethToUSD: number): ITransaction {
    const to = txData.to,
      from = txData.from,
      amount = this.web3.utils.fromWei(txData.value),
      fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6),
      direction = from === address ? 'OUT' : 'IN',
      amountInUSD = (Math.trunc(+amount * ethToUSD * 100) / 100).toString();

    return {
      to,
      from,
      amount,
      amountInUSD,
      txId: txData.hash,
      direction,
      tokenName: 'BNB',
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
    const decimal = getBNFromDecimal(parseInt(txData.tokenDecimal, 10));

    const to = txData.to;
    const from = txData.from;
    const amountInBN = new BigNumber(txData.value);
    const amount = amountInBN.dividedBy(decimal).toFormat();
    const fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6);
    const direction = from === address ? 'OUT' : 'IN';

    return {
      to,
      from,
      amount: removeTrailingZeros(amount),
      amountInUSD: removeTrailingZeros(amount),
      txId: txData.hash,
      direction,
      tokenName: txData.tokenSymbol,
      timestamp: +txData.timeStamp,
      fee,
    };
  }
}
