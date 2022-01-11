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
    address = '18LT7D1wT4Qi28wrdK1DvKFgTy9gtrK9TK';
    const { data: ltcToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/LTC`, {
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
            bitcoin(network: bitcoin) {
              outputs(outputAddress: {is: "${address}"}) {
                transaction {
                  hash
                }
                outputIndex
                outputDirection
                value(in: LTC)
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
                value(in: LTC)
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
        this.convertTransactionToCommonFormat(el, Number(ltcToUSD.data.usd), 'IN')
      )
    );

    transactions.push(
      ...resp.data.data.bitcoin.outputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(ltcToUSD.data.usd), 'OUT')
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
    const sochain_network = 'LTCTEST',
      privateKey = data.privateKey,
      sourceAddress = this.keys.publicKey,
      utxos = await axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`),
      transaction = new bitcoin.TransactionBuilder(bitcoin.networks.testnet),
      amount = Math.trunc(data.amount * 1e8),
      privateKeyECpair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), { network: bitcoin.networks.testnet });

    let totalInputsBalance = 0,
      fee = 0,
      inputCount = 1,
      outputCount = 2;

    transaction.setVersion(1);

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
      fee = (inputCount * 146 + outputCount * 33 + 10) * 20;

      if (totalInputsBalance - amount - fee > 0) {
        return;
      }

      transaction.addInput(element.txid, element.output_no);
      inputCount + 1;
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
    ltcToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(ltcToUSD) : Number(ltcToUSD);
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
    const tokenName = 'LTC';
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
