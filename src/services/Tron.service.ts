/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData, ITransaction } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ICryptoCurrency, IToken } from '../models/token';
import { IResponse } from '../models/response';

import { tronWebProvider, tronUSDTContractAddress, backendApi, imagesURL } from '../constants/providers';

// @ts-ignore
import TronWeb from 'tronweb';
// @ts-ignore
import * as bip39 from 'bip39';
import axios from 'axios';
import { getBNFromDecimal } from '../utils/numbers';

import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
const bip32 = BIP32Factory(ecc);

import { BigNumber } from 'bignumber.js';
import { backendApiKey } from './../constants/providers';
import { bitqueryProxy } from './../constants/providers';

export class tronService implements IChainService {
  Tron: TronWeb;

  constructor() {
    this.Tron = new TronWeb(tronWebProvider);
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const publicKey = await this.Tron.address.fromPrivateKey(privateKey);
    this.Tron.setPrivateKey(privateKey);

    return publicKey;
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const seed = await bip39.mnemonicToSeed(mnemonic);

    const node = await bip32.fromSeed(seed);

    const child = await node.derivePath("m/44'/195'/0'/0/0");
    const privateKey = await child.privateKey.toString('hex');
    const publicKey = await this.Tron.address.fromPrivateKey(privateKey);

    this.Tron.setPrivateKey(privateKey);

    return {
      privateKey,
      publicKey,
    };
  }

  async getTokensByAddress(address: string): Promise<IToken[]> {
    const tokens: IToken[] = [];
    const { data: trxToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/TRX`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const nativeTokensBalance = await this.Tron.trx.getBalance(address);
    const USDTTokenBalance = await this.getCustomTokenBalance(address, tronUSDTContractAddress);

    tokens.push(
      this.generateTokenObject(this.Tron.fromSun(nativeTokensBalance), 'TRX', imagesURL + 'TRX.svg', 'native', trxToUSD.data.usd)
    );
    tokens.push(
      this.generateTokenObject(
        USDTTokenBalance,
        'Tether USDT',
        imagesURL + 'USDT.svg',
        'custom',
        trxToUSD.data.usd,
        trxToUSD.data.usdt,
        tronUSDTContractAddress
      )
    );

    return tokens;
  }

  async getFeePriceOracle(from:string, to: string, amount:number, tokenType?:'native'|'custom'): Promise<IFee> {
    const { data: trxToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/TRX`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    let value = tokenType == 'native'? 10 : 10000000;
    value = value*10e-10
    const usd = Math.trunc(value * Number(trxToUSD.data.usd) * 100) / 100;

    return {
      value,
      usd: usd,
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    console.log('get tron history');

    const { data: trxToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/TRX`, {
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

      transactions.push(...resp.data.data.tron.outbound);
    }

    if (transactions.length === 0) {
      return [];
    }

    transactions = transactions.map((el: any) => this.convertTransactionToCommonFormat(el, address, Number(trxToUSD.data.usd)));

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
    const result = await this.Tron.trx.sendTransaction(address, this.Tron.toSun(data.amount), data.privateKey);

    return result.txid;
  }

  async send20Token(data: ISendingTransactionData) {
    this.Tron.setPrivateKey(data.privateKey);
    const contract = await this.Tron.contract().at(data.cotractAddress);
    //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
    // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
    const result = await contract
      .transfer(
        data.receiverAddress, //address _to
        this.Tron.toSun(data.amount) //amount
      )
      .send({
        feeLimit: 10000000,
      });

    return result;
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

  private async getCustomTokenBalance(address: string, contractAddress: string): Promise<number> {
    const contract = await this.Tron.contract().at(contractAddress);
    const decimals = getBNFromDecimal(await contract.decimals().call());

    let balance = await contract.balanceOf(address).call();
    balance = new BigNumber(balance.toNumber()).div(decimals);

    return balance.toNumber();
  }

  private generateTokenObject(
    balance: number,
    tokenName: string,
    tokenLogo: string,
    tokenType: 'native' | 'custom',
    trxToUSD: string,
    trxToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(trxToCustomToken)) * Number(trxToUSD) : Number(trxToUSD);
    tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;

    const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
    const standard = tokenType === 'custom' ? 'TRC 20' : null;

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
      tron(network: tron) {
        outbound: transfers(
          ${direction}: {is: "${address}"},
          options: {desc: "any"}
          date: {after: "2021-12-01"}
          ) {
          txHash
          currency {
            symbol
            decimals
            address
            name
            tokenType
          }
          date {
            date(format: "YYYY.MM.DDThh:mm:ss")
            dayOfMonth
            year
            month
          }
          amount
          sender {
            address
          }
          receiver {
            address
          }
          fee
          success
          any(of: time)
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
  private convertTransactionToCommonFormat(txData: any, address: string, trxToUSD: number): ITransaction {
    const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
    const to = txData.receiver.address;
    const from = txData.sender.address;
    const amount = txData.amount;
    const direction = from === address ? 'OUT' : 'IN';
    const amountInUSD =
      txData.currency.symbol.toLowerCase() === 'trx' ? (Math.trunc(amount * trxToUSD * 100) / 100).toString() : amount;

    return {
      to,
      from,
      amount,
      amountInUSD,
      txId: txData.txHash,
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
