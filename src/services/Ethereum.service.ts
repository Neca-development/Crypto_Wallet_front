/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IResponse } from '../models/response';
import { ITransaction } from '../models/transaction';

import {
  ethWeb3Provider,
  etherUSDTContractAddress,
  etherGasPrice,
  backendApi,
  imagesURL,
  bitqueryProxy,
} from '../constants/providers';
import { backendApiKey } from './../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ethers } from 'ethers';
import { ICryptoCurrency, IToken } from '../models/token';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';

export class ethereumService implements IChainService {
  private web3: Web3;

  constructor() {
    this.web3 = new Web3(ethWeb3Provider);
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
    const { data: ethToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const nativeTokensBalance = await this.web3.eth.getBalance(address);
    const USDTTokenBalance = await this.getCustomTokenBalance(address, etherUSDTContractAddress);

    tokens.push(
      this.generateTokenObject(
        Number(this.web3.utils.fromWei(nativeTokensBalance)),
        'ETH',
        imagesURL + 'ETH.svg',
        'native',
        ethToUSD.data.usd
      )
    );

    tokens.push(
      this.generateTokenObject(
        USDTTokenBalance,
        'Tether USDT',
        imagesURL + 'USDT.svg',
        'custom',
        ethToUSD.data.usd,
        ethToUSD.data.usdt,
        etherUSDTContractAddress
      )
    );

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string): Promise<IFee> {
    const { data: ethToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const transactionObject = {
      from,
      to,
    };
    const gasLimit = await this.web3.eth.estimateGas(transactionObject);

    let { data: price } = await axios.get(etherGasPrice);
    const gasPriceGwei = price.fast / 10;

    const transactionFeeInEth = gasPriceGwei * 1e-9 * gasLimit;

    const usd = Math.trunc(transactionFeeInEth * Number(ethToUSD.data.usd) * 100) / 100;

    return {
      value: transactionFeeInEth,
      usd: usd,
    };
  }

  /**
   * @param {ISendingTransactionData} data:ISendingTransactionData
   * @returns {any}
   */
  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: ethToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const queries = [];
    let transactions = [];

    queries.push(this.generateTransactionsQuery(address, 'receiver'));
    queries.push(this.generateTransactionsQuery(address, 'sender'));

    for (const query of queries) {
      let { data: resp } = await axios.post(
        bitqueryProxy,
        {
          body: { query: query, variables: {} },
        },
        {
          headers: {
            'auth-client-key': backendApiKey,
          },
        }
      );

      transactions.push(...resp.data.data.ethereum.transfers);
    }

    transactions = transactions.map((el: any) =>
      this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), Number(ethToUSD.data.usdt))
    );

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
    const fee = await this.getFeePriceOracle(this.web3.defaultAccount, data.receiverAddress);

    const result = await this.web3.eth.sendTransaction({
      from: this.web3.eth.defaultAccount,
      to: data.receiverAddress,
      value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())).toString(),
      gas: Math.trunc(Number(fee.value) * 1e9),
    });

    return result.transactionHash;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    const tokenAddress = data.cotractAddress;
    const contract = new this.web3.eth.Contract(etherUSDTAbi as any, tokenAddress);
    const decimals = getBNFromDecimal(+(await contract.methods.decimals().call()));
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
    const contract = new this.web3.eth.Contract(etherUSDTAbi as any, contractAddress);
    const decimals = getBNFromDecimal(Number(await contract.methods.decimals().call()));

    let balance = await contract.methods.balanceOf(address).call();
    balance = new BigNumber(balance).dividedBy(decimals);

    return balance.toNumber();
  }

  private generateTokenObject(
    balance: number,
    tokenName: string,
    tokenLogo: string,
    tokenType: 'native' | 'custom',
    ethToUSD: string,
    ethToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(ethToCustomToken)) * Number(ethToUSD) : Number(ethToUSD);
    tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;

    const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
    const standard = tokenType === 'custom' ? 'ERC 20' : null;

    return {
      standard,
      balance,
      balanceInUSD,
      contractAddress,
      tokenName,
      tokenType,
      tokenPriceInUSD,
      tokenLogo,
    };
  }

  private generateTransactionsQuery(address: string, direction: 'receiver' | 'sender') {
    return `
      query{
      ethereum(network: ethereum) {
        transfers(
              options: {desc: "any", limit: 1000}
              amount: {gt: 0}
              ${direction}: {is: "0x9FaBf26C357bFd8A2a6fFE965EC1F72A55033DD0"}
            ) {
              any(of: time)
              address: receiver {
                address
                annotation
              }
              sender {
                address
              }
              currency {
                address
                symbol
              }
              amount
              transaction {
                hash
              }
              external
            }
          }
      }
    `;
  }

  /**
   * @param {any} txData:any
   * @param {string} address:string
   * @param {number} trxToUSD:number
   * @returns {ITransaction}
   */
  private convertTransactionToCommonFormat(
    txData: any,
    address: string,
    tokenPriceToUSD: number,
    nativeTokenToUSD: number
  ): ITransaction {
    const amount = new BigNumber(txData.amount).toFormat();

    let amountPriceInUSD = txData.currency.symbol === 'ETH' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
    amountPriceInUSD = Math.trunc(amountPriceInUSD * txData.amount * 100) / 100;

    const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
    const to = txData.address.address;
    const from = txData.sender.address;
    const direction = from === address.toLowerCase() ? 'OUT' : 'IN';

    return {
      to,
      from,
      amount,
      amountInUSD: amountPriceInUSD.toString(),
      txId: txData.transaction.hash,
      direction,
      type: txData.tokenType,
      tokenName: txData.currency.symbol,
      timestamp: new Date(txData.any).getTime(),
      fee: txData.fee,
      status: txData.success,
      tokenLogo,
    };
  }
}
