/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { imagesURL, backendApi, backendApiKey, bitqueryProxy, rippleProvider } from '../constants/providers';

// @ts-ignore
import axios from 'axios';
import { IResponse } from '../models/response';

const xrpl = require('xrpl');

import { CustomError } from '../errors';
import { ErrorsTypes } from '../models/enums';

export class rippleService implements IChainService {
  private keys: IWalletKeys;
  private wallet;
  private xrplClient;
  private connectionPending: boolean;

  constructor() {
    this.xrplClient = new xrpl.Client(rippleProvider);
    // this.xrplClient.connect();

    // this.init();
  }

  async init() {
    this.connectionPending = true;
    await this.xrplClient.connect();
    this.connectionPending = false;
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    this.wallet = xrpl.Wallet.fromMnemonic(mnemonic);

    this.keys = {
      privateKey: this.wallet.privateKey,
      publicKey: this.wallet.address,
    };

    return this.keys;
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const publicKey = xrpl.Wallet.fromMnemonic(privateKey).address;

    this.keys = {
      privateKey,
      publicKey,
    };

    return publicKey;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    let xrplToUSD: IResponse<ICryptoCurrency>;
    try {
      xrplToUSD = (
        await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/XRP`, {
          headers: {
            'auth-client-key': backendApiKey,
          },
        })
      ).data;
    } catch (error) {
      console.log('server was dropped');
    }

    await this.checkConnection();

    const balance = await this.xrplClient.getXrpBalance(address);

    tokens.push(this.generateTokenObject(balance, 'XRP', imagesURL + 'XRP.svg', 'native', xrplToUSD.data.usd));

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string, amount: number): Promise<IFee> {
    const prepared = await this.xrplClient.autofill({
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Amount: (amount * 1e6).toString(),
      Destination: to,
    });

    const { data: xrplToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/XRP`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const value = xrpl.dropsToXrp(prepared.Fee);

    const usd = Math.trunc(Number(xrplToUSD.data.usd) * value * 100) / 100;

    return {
      value,
      usd,
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: xrplToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/XRP`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    await this.checkConnection();

    let transactions = await this.xrplClient.request({
      command: 'account_tx',
      account: address,
    });

    transactions = transactions.result.transactions.map((el: any) =>
      this.convertTransactionToCommonFormat(el.tx, Number(xrplToUSD.data.usd), address)
    );

    console.log(transactions);

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
    await this.checkConnection();

    const balance = await this.xrplClient.getXrpBalance(this.wallet.address);
    console.log(
      '%cMyProject%cline:144%cbalance',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(3, 101, 100);padding:3px;border-radius:2px',
      balance
    );

    if (balance - data.amount < 20) {
      throw Error("You can't send more than your account balance (minus the reserved amount (20 xrp)");
    }

    const prepared = await this.xrplClient.autofill({
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Amount: (data.amount * 1e6).toString(),
      Destination: data.receiverAddress,
      DestinationTag: data.destinationTag || 0,
    });

    const signed = this.wallet.sign(prepared);

    const tx = await this.xrplClient.submitAndWait(signed.tx_blob);

    return tx.result.hash;
  }

  async send20Token(): Promise<string> {
    throw new CustomError('Network doesnt support this method', 14, ErrorsTypes['Unknown error']);
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

  private generateTokenObject(
    balance: number,
    tokenName: string,
    tokenLogo: string,
    tokenType: 'native' | 'custom',
    xrplToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(xrplToUSD) : Number(xrplToUSD);
    tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;

    const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;

    return {
      balance,
      balanceInUSD,
      contractAddress,
      tokenName,
      tokenType,
      tokenPriceInUSD,
      tokenLogo,
    };
  }

  /**
   * @param {any} txData:any
   * @param {string} address:string
   * @param {number} trxToUSD:number
   * @returns {ITransaction}
   */
  private convertTransactionToCommonFormat(txData: any, tokenPriceToUSD: number, address: string): ITransaction {
    const amount = txData.Amount / 1e6;
    const amountPriceInUSD = Math.trunc(amount * tokenPriceToUSD * 100) / 100;
    const tokenLogo = imagesURL + 'XRP.svg';
    const to = txData.Destination;
    const from = txData.Account;
    const direction = from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN';

    return {
      to,
      from,
      amount: amount.toString(),
      amountInUSD: amountPriceInUSD.toString(),
      txId: txData.hash,
      direction,
      tokenName: 'XRP',
      timestamp: txData.date,
      fee: txData.Fee,
      status: true,
      tokenLogo,
    };
  }

  private async checkConnection() {
    return new Promise<void>(async (resolve) => {
      if (!this.xrplClient.isConnected()) {
        this.connectionPending = true;
        await this.xrplClient.connect();
        this.connectionPending = false;
        resolve();
      }

      if (this.connectionPending === true) {
        this.xrplClient.on('connected', async () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
