/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { imagesURL, backendApi, backendApiKey, bitqueryProxy, dashSatoshisPerByte } from '../constants/providers';

// @ts-ignore
import axios from 'axios';
import { IResponse } from '../models/response';

// @ts-ignore
import zcashcore from 'zcash-bitcore-lib';
// @ts-ignore

import { mnemonicToSeedSync } from 'bip39';

// import createHash from 'create-hash';
// import bs58check from 'bs58check';

import * as bitcoin from 'bitcoinjs-lib-zcash';
import * as utxolib from '@bitgo/utxo-lib';
import { CustomError } from '../errors';

import coininfo from 'coininfo';

// import HDKey from 'hdkey';

import { ErrorsTypes } from '../models/enums';

export class zcashService implements IChainService {
  private keys: IWalletKeys;

  constructor() {}

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const seed = mnemonicToSeedSync(mnemonic);

    console.log('dash', coininfo.dash.main.toBitcoinJS());
    console.log('litecoin', coininfo.litecoin.main.toBitcoinJS());
    console.log('zcash', coininfo.zcash.main.toBitcoinJS());
    console.log('bitGo-zcash', utxolib);

    const privateKey = zcashcore.HDPrivateKey.fromSeed(seed, coininfo.zcash.main.toBitcore())
      .derive("m/44'/133'/0'/0/0")
      .privateKey.toWIF();
    const publicKey = zcashcore.HDPrivateKey.fromSeed(seed, coininfo.zcash.main.toBitcore())
      .derive("m/44'/133'/0'/0/0")
      .privateKey.toAddress()
      .toString();
    console.log(zcashcore.PrivateKey(privateKey));

    this.keys = {
      privateKey,
      publicKey,
    };

    return this.keys;
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const publicKey = zcashcore.PrivateKey(privateKey).toAddress().toString();

    this.keys = {
      privateKey,
      publicKey,
    };

    return publicKey;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    let dashToUSD: IResponse<ICryptoCurrency>;
    try {
      //  TODO попросить бэк добавить курс 	ZEC
      // dashToUSD  = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/	ZEC`, {
      //   headers: {
      //     'auth-client-key': backendApiKey,
      //   },
      // });

      dashToUSD = {
        data: {
          id: 5,
          coinName: '	ZEC',
          usd: '95.5',
        },
      };
    } catch (error) {
      console.log('server was dropped');
    }

    const sochain_network = '	ZEC';

    let { data: balance } = await axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);

    balance = balance.data.confirmed_balance;

    const nativeTokensBalance = balance;

    tokens.push(this.generateTokenObject(nativeTokensBalance, '	ZEC', imagesURL + '	ZEC.svg', 'native', dashToUSD.data.usd));

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string, amount: number): Promise<IFee> {
    amount = Math.trunc(amount * 1e8);
    const sochain_network = '	ZEC',
      sourceAddress = from,
      utxos = await axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);

    let totalInputsBalance = 0,
      fee = 0,
      inputCount = 0,
      outputCount = 2;

    utxos.data.data.txs.sort((a: any, b: any) => {
      if (Number(a.value) > Number(b.value)) {
        return -1;
      } else if (Number(a.value) < Number(b.value)) {
        return 1;
      } else {
        return 0;
      }
    });

    utxos.data.data.txs.forEach(async (element: any) => {
      fee = (inputCount * 146 + outputCount * 33 + 10) * 20 * dashSatoshisPerByte;

      if (totalInputsBalance - amount - fee > 0) {
        return;
      }

      inputCount += 1;
      totalInputsBalance += Math.floor(Number(element.value) * 100000000);
    });

    if (totalInputsBalance - amount - fee < 0) {
      throw new Error('Balance is too low for this transaction');
    }

    const value = fee * 1e-8;

    //  TODO попросить бэк добавить курс 	ZEC
    // const { data: dashToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/	ZEC`, {
    //   headers: {
    //     'auth-client-key': backendApiKey,
    //   },
    // });

    const dashToUSD = {
      data: {
        usd: 95.5,
      },
    };

    const usd = Math.trunc(Number(dashToUSD.data.usd) * value * 100) / 100;

    return {
      value,
      usd,
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    //  TODO попросить бэк добавить курс 	ZEC
    // const { data: dashToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/	ZEC`, {
    //   headers: {
    //     'auth-client-key': backendApiKey,
    //   },
    // });

    const dashToUSD = {
      data: {
        usd: 95.5,
      },
    };

    let transactions = [];

    let { data: resp } = await axios.post(
      bitqueryProxy,
      {
        body: {
          query: `
          query {
            bitcoin(network: dash) {
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
        this.convertTransactionToCommonFormat(el, Number(dashToUSD.data.usd), 'IN')
      )
    );

    transactions.push(
      ...resp.data.data.bitcoin.outputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(dashToUSD.data.usd), 'OUT')
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
    let netGain = utxolib.networks.zcash;
    console.log(
      '%cMyProject%cline:250%cnetGain',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(130, 57, 53);padding:3px;border-radius:2px',
      netGain
    );

    const sochain_network = 'ZEC',
      privateKey = data.privateKey,
      sourceAddress = this.keys.publicKey,
      utxos = await axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`),
      // @ts-ignore
      transaction = new utxolib.bitgo.createTransactionBuilderForNetwork(netGain),
      amount = Math.trunc(data.amount * 1e8);
    console.log(transaction);

    let privateKeyECpair = bitcoin.ECPair.fromWIF(privateKey, netGain);

    let totalInputsBalance = 0,
      fee = 0,
      inputCount = 0,
      outputCount = 2;

    transaction.setVersion(1);
    console.log(utxos);

    utxos.data.data.txs.sort((a: any, b: any) => {
      if (Number(a.value) > Number(b.value)) {
        return -1;
      } else if (Number(a.value) < Number(b.value)) {
        return 1;
      } else {
        return 0;
      }
    });

    utxos.data.data.txs.forEach(async (element: any) => {
      fee = (inputCount * 146 + outputCount * 33 + 10) * 20 * dashSatoshisPerByte * 10;
      console.log(fee);

      if (totalInputsBalance - amount - fee > 0) {
        return;
      }

      transaction.addInput(element.txid, element.output_no);
      inputCount += 1;
      totalInputsBalance += Math.floor(Number(element.value) * 100000000);
    });

    if (totalInputsBalance - amount - fee < 0) {
      throw new Error('Balance is too low for this transaction');
    }

    transaction.addOutput(data.receiverAddress, amount);
    transaction.addOutput(sourceAddress, totalInputsBalance - amount - fee);

    // This assumes all inputs are spending utxos sent to the same Dogecoin P2PKH address (starts with D)
    for (let i = 0; i < inputCount; i++) {
      transaction.sign(i, privateKeyECpair);
    }
    console.log(transaction.buildIncomplete().toHex());

    const { data: trRequest } = await axios.post(
      `${backendApi}transactions/so-chain/${sochain_network}`,
      {
        tx_hex: transaction.buildIncomplete().toHex(),
      },
      {
        headers: {
          'auth-client-key': backendApiKey,
        },
      }
    );

    return trRequest.data.txid;
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
    dashToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(dashToUSD) : Number(dashToUSD);
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
    const tokenName = '	ZEC';
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