/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData, ITransactionsData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { imagesURL, backendApi, backendApiKey, bitqueryProxy, bitcoinFeesURL } from '../constants/providers';

// @ts-ignore
import axios from 'axios';
import { IResponse } from '../models/response';

import { mnemonicToSeedSync } from 'bip39';

import * as bitcoin from 'bitcoinjs-lib';
import { CustomError } from '../errors';
import { ErrorsTypes } from '../models/enums';

export class bitcoinService implements IChainService {
  private keys: IWalletKeys;
  private network = bitcoin.networks.testnet;

  constructor() {}

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    console.log(mnemonic);

    const seed = mnemonicToSeedSync(mnemonic);
    console.log(seed);
    const root = bitcoin.bip32.fromSeed(seed, this.network).derivePath("m/44'/1'/0'/0/0");
    console.log(
      '%cMyProject%cline:31%croot',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(89, 61, 67);padding:3px;border-radius:2px',
      root
    );
    const keyPair = bitcoin.payments.p2pkh({ pubkey: root.publicKey, network: this.network });
    console.log(keyPair);

    const privateKey = root.toWIF();
    const publicKey = keyPair.address;

    this.keys = {
      privateKey,
      publicKey,
    };

    return this.keys;
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const pubkey = bitcoin.ECPair.fromWIF(privateKey, this.network).publicKey;
    const publicKey = bitcoin.payments.p2pkh({ pubkey, network: this.network }).address;

    this.keys = {
      privateKey,
      publicKey,
    };

    return publicKey;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    let btcToUSD: IResponse<ICryptoCurrency>;
    try {
      btcToUSD = (
        await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BTC`, {
          headers: {
            'auth-client-key': backendApiKey,
          },
        })
      ).data;
    } catch (error) {
      console.log('server was dropped');
    }

    const sochain_network = 'BTCTEST';

    let { data: balance } = await axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);

    balance = balance.data.confirmed_balance;

    const nativeTokensBalance = balance;

    tokens.push(this.generateTokenObject(nativeTokensBalance, 'BTC', imagesURL + 'BTC.svg', 'native', btcToUSD.data.usd));

    return tokens;
  }

  async getFeePriceOracle(
    from: string,
    to: string,
    amount: number,
    tokenTypes: 'native' | 'custom',
    speed: 'slow' | 'medium' | 'fast'
  ): Promise<IFee> {
    const { data: btcFeeCost } = await axios.get(bitcoinFeesURL);

    let bitcoinSatoshisPerByte;

    switch (speed) {
      case 'slow':
        bitcoinSatoshisPerByte = btcFeeCost.hourFee;
        break;
      case 'medium':
        bitcoinSatoshisPerByte = btcFeeCost.halfHourFee;
        break;
      case 'fast':
        bitcoinSatoshisPerByte = btcFeeCost.fastestFee;
        break;
      default:
        break;
    }

    amount = Math.trunc(amount * 1e8);
    const sochain_network = 'BTCTEST',
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
      fee = (inputCount * 146 + outputCount * 33 + 10) * bitcoinSatoshisPerByte;

      if (totalInputsBalance - amount - fee > 0) {
        return;
      }

      inputCount += 1;
      totalInputsBalance += Math.floor(Number(element.value) * 100000000);
    });

    if (totalInputsBalance - amount - fee < 0) {
      throw new Error('Balance is too low for this transaction');
    }

    const value = tokenTypes == 'native' ? fee * 1e-8 : null;

    const btcToUSD = (
      await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BTC`, {
        headers: {
          'auth-client-key': backendApiKey,
        },
      })
    ).data;

    const usd = Math.trunc(Number(btcToUSD.data.usd) * value * 100) / 100;

    return {
      value,
      usd,
    };
  }

  async getTransactionsHistoryByAddress(address: string, pageNumber?: number, pageSize?: number): Promise<ITransactionsData> {
    address = '18LT7D1wT4Qi28wrdK1DvKFgTy9gtrK9TK';
    const { data: btcToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BTC`, {
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
              outputs(
                outputAddress: {is: "${address}"}
                date: {after: "2021-12-01"}
                ) {
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
              inputs(inputAddress: {is: "${address}'"}
              date: {after: "2021-12-01"}
              ) {
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
        this.convertTransactionToCommonFormat(el, Number(btcToUSD.data.usd), 'IN')
      )
    );

    transactions.push(
      ...resp.data.data.bitcoin.outputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(btcToUSD.data.usd), 'OUT')
      )
    );

    if (transactions.length === 0) {
      return { transactions: [], length: 0 };
    }

    transactions.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return -1;
      } else if (a.timestamp < b.timestamp) {
        return 1;
      } else {
        return 0;
      }
    });
    const length = transactions.length;
    if (pageNumber || pageNumber === 0) {
      transactions = transactions.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    }
    console.log({
      transactions,
      length,
    });
    return {
      transactions,
      length,
    };
  }

  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    const sochain_network = 'BTCTEST',
      privateKey = data.privateKey,
      sourceAddress = this.keys.publicKey,
      utxos = await axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`),
      transaction = new bitcoin.TransactionBuilder(this.network),
      amount = Math.trunc(data.amount * 1e8),
      privateKeyECpair = bitcoin.ECPair.fromWIF(privateKey, this.network);

    let totalInputsBalance = 0,
      fee = 0,
      inputCount = 0,
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
    btcToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(btcToUSD) : Number(btcToUSD);
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
    const tokenName = 'BTC';
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
      currencyFee: 'BTC',
      status: true,
      tokenLogo,
    };
  }
}
