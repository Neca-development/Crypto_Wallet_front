/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { imagesURL, backendApi, backendApiKey, bitqueryProxy, zcashSatoshisPerByte } from '../constants/providers';

// @ts-ignore
import axios from 'axios';
import { IResponse } from '../models/response';

// @ts-ignore
import zcashcore from 'zcash-bitcore-lib';
// @ts-ignore
import * as zcash from 'bitcoinjs-lib-zcash';

import { mnemonicToSeedSync } from 'bip39';

import * as utxolib from '@bitgo/utxo-lib';
import { CustomError } from '../errors';

import coininfo from 'coininfo';

import { ErrorsTypes } from '../models/enums';

export class zcashService implements IChainService {
  private keys: IWalletKeys;
  private network = utxolib.networks.zcash;

  constructor() {}

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const seed = mnemonicToSeedSync(mnemonic);

    const privateKey = zcashcore.HDPrivateKey.fromSeed(seed, coininfo.zcash.main.toBitcore())
      .derive("m/44'/133'/0'/0/0")
      .privateKey.toWIF();
    const publicKey = zcashcore.HDPrivateKey.fromSeed(seed, coininfo.zcash.main.toBitcore())
      .derive("m/44'/133'/0'/0/0")
      .privateKey.toAddress()
      .toString();

    // const root = utxolib.bip32.fromSeed(seed, this.network).derivePath("m/44'/133'/0'/0/0");
    // const keyPair1 = utxolib.bitgo.keyutil.privateKeyBufferToECPair(root.privateKey, this.network);

    // console.log(root.toWIF());
    // console.log(utxolib.payments.p2pkh({ pubkey: keyPair1.publicKey, network: this.network }).address);

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
    let zcashToUSD: IResponse<ICryptoCurrency>;
    try {
      zcashToUSD = (
        await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ZEC`, {
          headers: {
            'auth-client-key': backendApiKey,
          },
        })
      ).data;
    } catch (error) {
      console.log('server was dropped');
    }

    const sochain_network = 'ZEC';

    let { data: balance } = await axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);

    balance = balance.data.confirmed_balance;

    const nativeTokensBalance = balance;

    tokens.push(this.generateTokenObject(nativeTokensBalance, 'ZEC', imagesURL + 'ZEC.svg', 'native', zcashToUSD.data.usd));

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string, amount: number): Promise<IFee> {
    amount = Math.trunc(amount * 1e8);
    const sochain_network = 'ZEC',
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
      fee = (inputCount * 146 + outputCount * 33 + 10) * zcashSatoshisPerByte;

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

    const { data: zcashToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ZEC`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const usd = Math.trunc(Number(zcashToUSD.data.usd) * value * 100) / 100;

    return {
      value,
      usd,
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: zcashToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ZEC`, {
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
            bitcoin(network: zcash) {
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
        this.convertTransactionToCommonFormat(el, Number(zcashToUSD.data.usd), 'IN')
      )
    );

    transactions.push(
      ...resp.data.data.bitcoin.outputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(zcashToUSD.data.usd), 'OUT')
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

    const sochain_network = 'ZEC',
      privateKey = data.privateKey,
      sourceAddress = this.keys.publicKey,
      amount = Math.trunc(data.amount * 1e8),
      //@ts-ignore
      keyPair = utxolib.ECPair.fromWIF(privateKey, netGain),
      // @ts-ignore
      transaction = new utxolib.bitgo.ZcashTransactionBuilder(netGain),
      utxos = await axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);

    transaction.setVersion(utxolib.bitgo.ZcashTransaction.VERSION_SAPLING);
    transaction.setVersionGroupId(parseInt('0x892F2085', 16));

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
      fee = (inputCount * 146 + outputCount * 33 + 10) * zcashSatoshisPerByte;

      if (totalInputsBalance - amount - fee > 0) {
        return;
      }

      transaction.addInput(element.txid, element.output_no);
      inputCount += 1;
      totalInputsBalance += Math.floor(Number(element.value) * 1e8);
    });

    if (totalInputsBalance - amount - fee < 0) {
      throw new Error('Balance is too low for this transaction');
    }

    transaction.addOutput(data.receiverAddress, amount);
    transaction.addOutput(sourceAddress, totalInputsBalance - amount - fee);

    for (let i = 0; i < inputCount; i++) {
      transaction.sign(i, keyPair, null, utxolib.bitgo.ZcashTransaction.SIGHASH_ALL, Number(utxos.data.data.txs[i].value) * 1e8);
    }

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
    zcashToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(zcashToUSD) : Number(zcashToUSD);
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
    const tokenName = 'ZEC';
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
