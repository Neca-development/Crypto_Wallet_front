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
import { backendApiKey } from '../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { mnemonicToSeedSync } from 'bip39';
import { u } from '@cityofzion/neon-core';
// @ts-ignore
const { default: Neon, api } = require('@cityofzion/neon-js');
import { ICryptoCurrency, IToken } from '../models/token';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
import { neoProvider } from './../constants/providers';

export class neoService implements IChainService {
  private web3: Web3;
  private network = 'MainNet';
  private apiProvider;
  private neoWallet;

  constructor() {
    console.log({ api, Neon });

    this.web3 = new Web3(ethWeb3Provider);
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const seed = Array.from(mnemonicToSeedSync(mnemonic).slice(0, 32));
    const privateKey = u.ab2hexstring(seed);
    this.neoWallet = Neon.create.wallet();
    this.neoWallet.addAccount(privateKey);
    const account = this.neoWallet.accounts[0];
    // console.log(this.neoWallet);

    return {
      privateKey: account.WIF,
      publicKey: account.address,
    };
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    return address;
  }

  async getTokensByAddress(address: string) {
    const balance = await api.getTokenBalances(address);
    console.log(
      '%cMyProject%cline:70%cbalance',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(39, 72, 98);padding:3px;border-radius:2px',
      balance
    );
    const tokens: Array<IToken> = [];
    const { data: neoToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    tokens.push(
      this.generateTokenObject(
        balance.assets['NEO'].balance.toNumber,
        'NEO',
        imagesURL + 'NEO.svg',
        'native',
        neoToUSD.data.usd,
        neoToUSD.data.usdt,
        etherUSDTContractAddress
      )
    );

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string): Promise<IFee> {
    const { data: neoToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
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

    const usd = Math.trunc(transactionFeeInEth * Number(neoToUSD.data.usd) * 100) / 100;

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
    const { data: neoToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
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
      this.convertTransactionToCommonFormat(el, address, Number(neoToUSD.data.usd), Number(neoToUSD.data.usdt))
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
    neoToUSD: string,
    ethToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(ethToCustomToken)) * Number(neoToUSD) : Number(neoToUSD);
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
