/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';
// @ts-ignore
import * as bitboxSdk from 'bitbox-sdk';

import { imagesURL, backendApi, backendApiKey, bitqueryProxy } from '../constants/providers';

// @ts-ignore
import axios from 'axios';
import { IResponse } from '../models/response';

// @ts-ignore
import litecore from 'bitcore-lib-ltc';

import * as bitcoin from 'bitcoinjs-lib';
import { CustomError } from '../errors';

// import HDKey from 'hdkey';

import { ErrorsTypes } from '../models/enums';

export class bitcoincashService implements IChainService {
  private keys: IWalletKeys;
  private bitbox: bitboxSdk.BITBOX;
  private NETWORK: string = `mainnet`;

  constructor() {
    // Set NETWORK to either testnet or mainnet

    // Instantiate BITBOX based on the network.
    this.bitbox =
      this.NETWORK === `mainnet`
        ? new bitboxSdk.BITBOX({ restURL: `https://rest.bitcoin.com/v2/` })
        : new bitboxSdk.BITBOX({ restURL: `https://trest.bitcoin.com/v2/` });
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    // These objects used for writing wallet information out to a file.
    const outObj: any = {};
    outObj.mnemonic = mnemonic;

    // root seed buffer
    const rootSeed = this.bitbox.Mnemonic.toSeed(mnemonic);

    // master HDNode
    const masterHDNode = this.bitbox.HDNode.fromSeed(rootSeed, this.NETWORK);

    // Generate the first 10 seed addresses.
    const childNode = masterHDNode.derivePath(`m/44'/145'/0'/0/0`);
    const publicKey = this.bitbox.HDNode.toCashAddress(childNode);

    const privateKey = this.bitbox.HDNode.toWIF(childNode);

    this.keys = {
      privateKey,
      publicKey,
    };

    return this.keys;
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const publicKey = litecore.PrivateKey(privateKey).toAddress('testnet').toString();

    this.keys = {
      privateKey,
      publicKey,
    };

    return publicKey;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    let bchToUSD: IResponse<ICryptoCurrency>;
    try {
      bchToUSD = (
        await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BCH`, {
          headers: {
            'auth-client-key': backendApiKey,
          },
        })
      ).data;
    } catch (error) {
      console.log('server was dropped');
    }

    let addressInfo: any;

    // Get the balance of the wallet.
    try {
      // first get BCH balance
      addressInfo = await this.bitbox.Address.details(address);
    } catch (err) {
      console.error(`Error in getBalance: `, err);
      process.exit(1);
    }

    tokens.push(this.generateTokenObject(addressInfo.balance, 'BCH', imagesURL + 'BCH.svg', 'native', bchToUSD.data.usd));

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string): Promise<IFee> {
    console.log({ from, to });

    return {
      value: '12324',
      usd: '2',
    };
  }

  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    address = 'qpasvklrlksww840y6tsfdldj9r2867gpuwtrlpxhn';
    const { data: bchToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BCH`, {
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
            bitcoin(network: bitcash) {
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
        this.convertTransactionToCommonFormat(el, Number(bchToUSD.data.usd), 'IN')
      )
    );

    transactions.push(
      ...resp.data.data.bitcoin.outputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(bchToUSD.data.usd), 'OUT')
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
    // Replace the address below with the address you want to send the BCH to.
    let RECV_ADDR = data.receiverAddress;
    const SEND_WIF = data.privateKey;
    const SATOSHIS_TO_SEND = Math.trunc(data.amount * 1e8);

    const SEND_ADDR = this.keys.publicKey;

    // Send the money back to yourself if the users hasn't specified a destination.
    if (RECV_ADDR === '') RECV_ADDR = SEND_ADDR;

    const RECV_ADDR_LEGACY = this.bitbox.Address.toLegacyAddress(RECV_ADDR);

    const u: any = await this.bitbox.Address.utxo(SEND_ADDR);

    const transactionBuilder = new this.bitbox.TransactionBuilder(this.NETWORK);

    const satoshisPerByte = 1.3;

    let totalInputsBalance = 0,
      fee = 0,
      inputCount = 0;

    sortUtxos(u.utxos);

    u.utxos.forEach(async (utxo: any) => {
      fee = Math.floor(this.bitbox.BitcoinCash.getByteCount({ P2PKH: inputCount }, { P2PKH: 2 }) * satoshisPerByte);

      if (totalInputsBalance - SATOSHIS_TO_SEND - fee > 0) {
        return;
      }

      // add input with txid and index of vout
      transactionBuilder.addInput(utxo.txid, utxo.vout);

      totalInputsBalance = Math.floor(totalInputsBalance + utxo.satoshis);
    });

    if (totalInputsBalance - SATOSHIS_TO_SEND - fee < 0) {
      throw new Error('Balance is too low for this transaction');
    }

    // amount to send back to the sending address.
    // It's the original amount - 1 sat/byte for tx size
    const remainder = totalInputsBalance - SATOSHIS_TO_SEND - fee;

    // add output w/ address and amount to send
    transactionBuilder.addOutput(RECV_ADDR_LEGACY, SATOSHIS_TO_SEND);
    if (remainder >= 1000) {
      transactionBuilder.addOutput(SEND_ADDR, remainder);
    }

    const ecPair = this.bitbox.ECPair.fromWIF(SEND_WIF);

    // Sign the transaction with the HD node.
    let redeemScript;

    for (let i = 0; i < inputCount; i++) {
      transactionBuilder.sign(i, ecPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, u.utxos[i].satoshis);
    }

    // build tx
    const tx = transactionBuilder.build();
    // output rawhex
    const hex = tx.toHex();

    // Broadcast transation to the network
    const txidStr = await this.bitbox.RawTransactions.sendRawTransaction([hex]);

    return txidStr;

    // Returns the utxo with the biggest balance from an array of utxos.
    function sortUtxos(utxos: any) {
      utxos.sort((a: any, b: any) => {
        if (a.satoshis > b.satoshis) {
          return -1;
        } else if (a.satoshis < b.satoshis) {
          return 1;
        } else {
          return 0;
        }
      });
    }
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
    bchToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(bchToUSD) : Number(bchToUSD);
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
    const tokenName = 'BCH';
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
