/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { imagesURL, backendApi, backendApiKey, bitqueryProxy, dogeSatoshisPerByte } from '../constants/providers';

// @ts-ignore
import axios from 'axios';
import { IResponse } from '../models/response';

// @ts-ignore
import dogecore from 'bitcore-lib-doge';
import { mnemonicToSeedSync } from 'bip39';

const xrpl = require('xrpl');

import { CustomError } from '../errors';
import { ErrorsTypes } from '../models/enums';

export class rippleService implements IChainService {
  private keys: IWalletKeys;
  private wallet;

  constructor() {}
  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    console.log(mnemonicToSeedSync(mnemonic));

    this.wallet = xrpl.Wallet.fromMnemonic(mnemonic);
    console.log(this.wallet);
    console.log(xrpl.Wallet.fromEntropy(mnemonicToSeedSync(mnemonic)));

    this.keys = {
      privateKey: this.wallet.privateKey,
      publicKey: this.wallet.address,
    };

    return this.keys;
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const publicKey = dogecore.PrivateKey(privateKey).toAddress().toString();

    this.keys = {
      privateKey,
      publicKey,
    };

    return publicKey;
  }

  async getTokensByAddress(address: string) {
    console.log(address);

    const tokens: Array<IToken> = [];
    let dogeToUSD: IResponse<ICryptoCurrency>;
    try {
      dogeToUSD = (
        await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/XRP`, {
          headers: {
            'auth-client-key': backendApiKey,
          },
        })
      ).data;
    } catch (error) {
      console.log('server was dropped');
    }

    const balance = 1000;

    const nativeTokensBalance = balance;

    tokens.push(this.generateTokenObject(nativeTokensBalance, 'XRP', imagesURL + 'XRP.svg', 'native', dogeToUSD.data.usd));

    return tokens;
  }

  async getFeePriceOracle(): Promise<IFee> {
    const value = 99;
    const usd = 1;

    return {
      value,
      usd,
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: dogeToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/XRP`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    let transactions = [];

    let { data: resp } = await axios.post(
      bitqueryProxy,
      {
        body: {
          query: `
          query {
            bitcoin(network: dogecoin) {
              outputs(outputAddress: {is: "${address}"}) {
                transaction {
                  hash
                }
                outputIndex
                outputDirection
                value(in: BTC)
                outputAddress {
                  address
                }
                block {
                  height
                  timestamp {
                    time(format: "%Y-%m-%d %H:%M:%S")
                  }
                }
                outputScript
              }
              inputs(inputAddress: {is: "${address}'"}) {
                transaction {
                  hash
                }
                value(in: BTC)
                block {
                  height
                  timestamp {
                    time(format: "%Y-%m-%d %H:%M:%S")
                  }
                }
                inputAddress {
                  address
                }
              }
            }
          }
        `,
          variables: {},
        },
      },
      {
        headers: {
          'auth-client-key': backendApiKey,
        },
      }
    );

    transactions.push(
      ...resp.data.data.bitcoin.inputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(dogeToUSD.data.usd), 'IN')
      )
    );

    transactions.push(
      ...resp.data.data.bitcoin.outputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(dogeToUSD.data.usd), 'OUT')
      )
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
    const client = new xrpl.Client('wss://xrplcluster.com');
    await client.connect();

    const prepared = await client.autofill({
      TransactionType: 'Payment',
      Account: this.wallet.address,
      Amount: (data.amount * 1e6).toString(),
      Destination: data.receiverAddress,
    });

    // @ts-ignore
    const max_ledger = prepared.LastLedgerSequence;
    console.log('Prepared transaction instructions:', prepared);
    // @ts-ignore
    console.log('Transaction cost:', xrpl.dropsToXrp(prepared.Fee), 'XRP');
    console.log('Transaction expires after ledger:', max_ledger);

    const signed = this.wallet.sign(prepared);
    console.log('Identifying hash:', signed.hash);
    console.log('Signed blob:', signed.tx_blob);

    const tx = await client.submitAndWait(signed.tx_blob);
    console.log(
      '%cMyProject%cline:270%ctx',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(20, 68, 106);padding:3px;border-radius:2px',
      tx
    );

    client.disconnect();
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
    dogeToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(dogeToUSD) : Number(dogeToUSD);
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
  private convertTransactionToCommonFormat(txData: any, tokenPriceToUSD: number, direction: 'IN' | 'OUT'): ITransaction {
    let amountPriceInUSD = Math.trunc(txData.value * tokenPriceToUSD * 100) / 100;
    const tokenName = 'XRP';
    const tokenLogo = imagesURL + tokenName + '.svg';
    const from = direction === 'OUT' ? txData.outputAddress.address : 'unknown';
    const to = direction === 'IN' ? txData.inputAddress.address : 'unknown';

    return {
      to,
      from,
      amount: txData.value.toFixed(8),
      amountInUSD: amountPriceInUSD.toString(),
      txId: txData.transaction.hash,
      direction,
      tokenName,
      timestamp: new Date(txData.block.timestamp.time).getTime(),
      fee: undefined,
      status: true,
      tokenLogo,
    };
  }
}
