/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData, ITransaction } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IToken } from '../models/token';

import { tronGridApi, tronScanApi, tronWebProvider } from '../constants/providers';
import { coinConverterApi, bitqueryApi, bitqueryKey } from '../constants/providers';

// @ts-ignore
import TronWeb from 'tronweb';
// @ts-ignore
import hdWallet from 'tron-wallet-hd';
import axios from 'axios';
import { getBNFromDecimal, removeTrailingZeros } from '../utils/numbers';

import { BigNumber } from 'bignumber.js';

export class tronService implements IChainService {
  Tron: any;

  constructor() {
    this.Tron = new TronWeb(tronWebProvider);
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const data = await hdWallet.getAccountFromPrivateKey(privateKey);

    return data;
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
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
        x.tokenAbbr.toLowerCase() === 'usdt'
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

    let value = '10';

    const usd = Math.trunc(+value * trxToUSD.tron.usd * 100) / 100;

    return {
      value,
      usd: usd.toString(),
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: trxToUSD } = await axios.get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`);

    const receiverQuery = this.generateTransactionsQuery(address, 'receiver');
    const senderQuery = this.generateTransactionsQuery(address, 'sender');

    const { data: receivingTransactions } = await axios.post(
      bitqueryApi,
      {
        query: receiverQuery,
        variables: {
          id: 2,
          city: 'Test',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': bitqueryKey,
        },
      }
    );

    const { data: sendingTransactions } = await axios.post(
      bitqueryApi,
      {
        query: senderQuery,
        variables: {
          id: 2,
          city: 'Test',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': bitqueryKey,
        },
      }
    );

    let transactions: ITransaction[] = [
      ...receivingTransactions.data.tron.outbound,
      ...sendingTransactions.data.tron.outbound,
    ];

    transactions = transactions.map((el: any) => this.convertTransactionToCommonFormat(el, address, trxToUSD.tron.usd));

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

  private generateTransactionsQuery(address: string, direction: 'receiver' | 'sender') {
    return `
      query{
      tron(network: tron) {
        outbound: transfers(${direction}: {is: "${address}"}, options: {desc: "any"}) {
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
    const to = txData.receiver.address;
    const from = txData.sender.address;
    const amount = txData.amount;
    const direction = from === address ? 'OUT' : 'IN';
    const amountInUSD =
      txData.currency.symbol.toLowerCase() === 'trx' ? (Math.trunc(amount * trxToUSD * 100) / 100).toString() : amount;

    console.log(txData);

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
    };
  }
}
