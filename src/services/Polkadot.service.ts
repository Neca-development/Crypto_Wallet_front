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
  bitqueryProxy, blockChairAPI
} from '../constants/providers';
import { backendApiKey } from '../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
// @ts-ignore
import { ethers } from 'ethers';
import { ICryptoCurrency, IToken } from '../models/token';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';

import { Keyring } from '@polkadot/keyring';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN_HUNDRED, hexToNumber, stringToHex, stringToU8a, u8aToString } from '@polkadot/util';
import { CustomError } from '../errors';
import { ErrorsTypes } from '../models/enums';


export class polkadotService implements IChainService {
  private _provider: any;
  private _api: any;
  private _publicKey: string;
  private _keyring: Keyring;
  private web3: Web3;
  private _tx: any;
  constructor() {
    this._provider = new WsProvider('wss://rpc.polkadot.io');


  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    this._api = await ApiPromise.create({ provider: this._provider });
    this._keyring = new Keyring({ type: 'ed25519', ss58Format: 0 });
    const pair = this._keyring.addFromUri(mnemonic);
    this._publicKey = pair.address;
    const registry  = await this._api.query
    this._api.tx.balances.setBalance(this._publicKey, 20, 8)
    return {
      publicKey: this._publicKey, privateKey: null
    };

  }


  async generatePublicKey(privateKey: string): Promise<string> {
    this._api = await ApiPromise.create({ provider: this._provider });
    this._keyring = new Keyring({ type: 'ed25519', ss58Format: 0 });
    this._publicKey = this._keyring.addFromUri(privateKey).address;
    const address = this._publicKey;
    return address;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    const { data: dotToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/DOT`, {
      headers: {
        'auth-client-key': backendApiKey
      }
    });
    const {data:{free: nativeTokensBalance}} = await this._api.query.system.account(this._publicKey);
    // const USDTTokenBalance = await this.getCustomTokenBalance(address, etherUSDTContractAddress);

    tokens.push(
      this.generateTokenObject(
        Number(nativeTokensBalance*10e-10),
        'DOT',
        imagesURL + 'DOT.svg',
        'native',
        dotToUSD.data.usd
      )
    );

    // tokens.push(
    //   this.generateTokenObject(
    //     USDTTokenBalance,
    //     'Tether USDT',
    //     imagesURL + 'USDT.svg',
    //     'custom',
    //     dotToUSD.data.usd,
    //     dotToUSD.data.usdt,
    //     etherUSDTContractAddress
    //   )
    // );

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string, amount?: number | null, tokenTypes?: 'native' | 'custom'): Promise<IFee> {
    const { data: dotToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/DOT`, {
      headers: {
        'auth-client-key': backendApiKey
      }
    });
    // const adres = '0x02b33c917f2f6103448d7feb42614037d05928433cb25e78f01a825aa829bb3c27';
    // const {data} = await axios.get(`https://api.snowtrace.io/api?module=account&action=txlist&address=${adres}&startblock=1&endblock=99999999&sort=asc&apikey=YourApiKeyToken`)
    this._tx = this._api.tx.balances.transfer(to, +amount * 10e10);
    const { partialFee: fee } = await this._tx.paymentInfo(from);

    const transactionFeeInDot = tokenTypes == 'native' ? Math.trunc(10e-10 * fee.toJSON() * 1000) / 1000 : null;

    const usd = Math.trunc(transactionFeeInDot * Number(dotToUSD.data.usd) * 100) / 100;

    return {
      value: transactionFeeInDot,
      usd
    };
  }

  /**
   * @param {ISendingTransactionData} data:ISendingTransactionData
   * @returns {any}
   */
  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: ethToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/DOT`, {
      headers: {
        'auth-client-key': backendApiKey
      }
    });

    const { data: { data: data } } = await axios.get(`${blockChairAPI}${address}`);
    // const queries = [];
    let transactions = [];
    console.log(data)
    // queries.push(this.generateTransactionsQuery(address, 'receiver'));
    // queries.push(this.generateTransactionsQuery(address, 'sender'));
    //
    // for (const query of queries) {
    //   let { data: resp } = await axios.post(
    //     bitqueryProxy,
    //     {
    //       body: { query: query, variables: {} }
    //     },
    //     {
    //       headers: {
    //         'auth-client-key': backendApiKey
    //       }
    //     }
    //   );
// console.log(resp) }
    transactions.push(...data[Object.keys(data)[0]].transfers);

    console.log(transactions)
    transactions = transactions.map((el: any) =>
        this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), Number(ethToUSD.data.usdt), 'dot', 'TransferContract')
    );
    console.log(transactions)
    transactions.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return -1;
      } else if (a.timestamp < b.timestamp) {
        return 1;
      } else {
        return 0;
      }
    });
    console.log(transactions)
    return transactions;
  }

  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    const transactionHash = await this._api.tx.balances.transfer(data.receiverAddress, data.amount)
    transactionHash.signAndSend(this._publicKey)
    return transactionHash;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    // const tokenAddress = data.cotractAddress;
    // const contract = new this.web3.eth.Contract(etherUSDTAbi as any, tokenAddress);
    // const decimals = getBNFromDecimal(+(await contract.methods.decimals().call()));
    // const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
    // const result = await contract.methods
    //   .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
    //   .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
    // console.log(result);

    throw new CustomError('Network doesnt support this method', 14, ErrorsTypes['Unknown error']);;
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
      tokenLogo
    };
  }

  private generateTransactionsQuery(address: string, direction: 'receiver' | 'sender') {
    return `
      query{
      polkadot(network: polkadot) {
        transfers(
              options: {desc: "any", limit: 1000}
              amount: {gt: 0}
              ${direction}: {is: "0x7083609fce4d1d8dc0c979aab8c869ea2c873402"}
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
      nativeTokenToUSD: number,
      symbol: string,
      tokenType: 'TransferContract' | 'TriggerSmartContract'
  ): ITransaction {
    const amount = Math.trunc(txData.amount * 10e-8) / 100;

    let amountPriceInUSD = tokenPriceToUSD;
    amountPriceInUSD = Math.trunc(amountPriceInUSD * amount * 100) / 100;

    const tokenLogo = imagesURL + symbol.toUpperCase() + '.svg';
    const to = txData.recipient;
    const from = txData.sender;
    const direction = from === address.toLowerCase() ? 'OUT' : 'IN';

    return {
      to,
      from,
      amount: amount.toString(),
      amountInUSD: amountPriceInUSD.toString(),
      txId: txData.hash,
      direction,
      type: txData.event_id === 'Transfer' ? 'TransferContract' : 'TriggerSmartContract',
      tokenName: symbol,
      timestamp: new Date(txData.block_timestamp).getTime(),
      fee: txData.fee,
      status: !txData.failed,
      tokenLogo
    };
  }
}
