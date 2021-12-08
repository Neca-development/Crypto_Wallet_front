/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { getBNFromDecimal, removeTrailingZeros } from '../utils/numbers';

import { etherScanApiKey, binanceScanApi, backendApi, backendApiKey } from '../constants/providers';
import { binanceWeb3Provider, binanceUSDTContractAddress } from '../constants/providers';
import { bnbUSDTAbi } from '../constants/bnb-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { IResponse } from '../models/response';
export class binanceService implements IChainService {
  private web3: Web3;

  constructor() {
    this.web3 = new Web3(binanceWeb3Provider);
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    this.web3.eth.accounts.wallet.add(this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey));
    this.web3.eth.defaultAccount = wallet.address;

    return {
      privateKey: wallet.privateKey,
      publicKey: wallet.address,
    };
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    return address;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    const { data: bnbToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BNB`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const nativeTokensBalance = await this.web3.eth.getBalance(address);
    const USDTTokenBalance = await this.getCustomTokenBalance(address, binanceUSDTContractAddress);

    tokens.push(
      this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'BNB', 'native', bnbToUSD.data.usd)
    );

    tokens.push(
      this.generateTokenObject(
        USDTTokenBalance,
        'Tether USDT',
        'custom',
        bnbToUSD.data.usd,
        bnbToUSD.data.usdt,
        binanceUSDTContractAddress
      )
    );

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string): Promise<IFee> {
    const { data: bnbToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BNB`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const fee = await this.web3.eth.estimateGas({
      from,
      to,
    });

    let value = await this.web3.eth.getGasPrice();
    value = (+this.web3.utils.fromWei(value) * fee).toString();

    const usd = Math.trunc(+value * Number(bnbToUSD.data.usd) * 100) / 100;

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
    const { data: bnbToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BNB`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const transactions = [];

    const trxTransactions = await this.getNormalTransactions(address, Number(bnbToUSD.data.usd));

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

  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    const gasPrice = await this.web3.eth.getGasPrice();
    const gasCount = await this.web3.eth.estimateGas({
      value: this.web3.utils.toWei(data.amount.toString()),
    });

    const result = await this.web3.eth.sendTransaction({
      from: this.web3.eth.defaultAccount,
      to: data.receiverAddress,
      value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
      gasPrice: gasPrice,
      gas: gasCount,
    });

    return result.transactionHash;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    const tokenAddress = data.cotractAddress;
    const contract = new this.web3.eth.Contract(bnbUSDTAbi as any, tokenAddress);
    const decimals = getBNFromDecimal(+(await contract.methods._decimals().call()));
    const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
    const result = await contract.methods
      .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
      .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
    console.log(result);

    return result.transactionHash;
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

  private async getCustomTokenBalance(address: string, contractAddress: string): Promise<number> {
    const contract = new this.web3.eth.Contract(bnbUSDTAbi as any, contractAddress);
    const decimals = getBNFromDecimal(Number(await contract.methods.decimals().call()));

    let balance = await contract.methods.balanceOf(address).call();
    balance = new BigNumber(balance).dividedBy(decimals);

    return balance.toNumber();
  }

  private generateTokenObject(
    balance: number,
    tokenName: string,
    tokenType: 'native' | 'custom',
    bnbToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(bnbToUSD) : Number(bnbToUSD);
    tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;

    const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;

    return {
      balance,
      balanceInUSD,
      contractAddress,
      tokenName,
      tokenType,
      tokenPriceInUSD,
    };
  }

  /**
   * @param {string} address:string
   * @param {number} bnbToUSD:number
   * @returns {Promise<ITransaction[]>}
   */
  private async getNormalTransactions(address: string, bnbToUSD: number): Promise<ITransaction[]> {
    // get last 200  transactions

    const { data: transactions } = await axios.get(
      `${binanceScanApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`
    );

    return transactions.result.map((transaction: any) => {
      return this.convertTransactionToCommonFormat(transaction, address, bnbToUSD);
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
  private convertTransactionToCommonFormat(txData: any, address: string, bnbToUSD: number): ITransaction {
    const to = txData.to,
      from = txData.from,
      amount = this.web3.utils.fromWei(txData.value),
      fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6),
      direction = from === address ? 'OUT' : 'IN',
      amountInUSD = (Math.trunc(+amount * bnbToUSD * 100) / 100).toString();

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
