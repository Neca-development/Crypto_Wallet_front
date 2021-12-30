/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { imagesURL, backendApi, backendApiKey, bitqueryProxy } from '../constants/providers';

// @ts-ignore
import axios from 'axios';
import { IResponse } from '../models/response';

// @ts-ignore
import litecore from 'bitcore-lib-ltc';
// @ts-ignore

import * as ecc from 'tiny-secp256k1';
import BIP32Factory from 'bip32';

import { mnemonicToSeedSync } from 'bip39';

// import createHash from 'create-hash';
// import bs58check from 'bs58check';

import * as bitcoin from 'bitcoinjs-lib';
import { CustomError } from '../errors';

// import HDKey from 'hdkey';

const Mnemonic = require('bitcore-mnemonic-litecoin');

import { ErrorsTypes } from '../models/enums';

export class litecoinService implements IChainService {
  private keys: IWalletKeys;

  constructor() {}

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const addrFromMnemonic = new Mnemonic(mnemonic);

    const privateKey1 = addrFromMnemonic.toHDPrivateKey().derive("m/44'/2'/0'/0/0").privateKey.toString();
    console.log(
      '%cMyProject%cline:44%cprivateKey',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(161, 23, 21);padding:3px;border-radius:2px',
      privateKey1
    );
    const publicKey2 = addrFromMnemonic.toHDPrivateKey().derive("m/44'/1'/0'/0/0").privateKey.toAddress('testnet').toString();
    console.log(
      '%cMyProject%cline:45%cpublicKey',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(222, 125, 44);padding:3px;border-radius:2px',
      publicKey2
    );

    // -----------------------------------------------------------------------------------------------------------------

    console.log(litecore);

    var value = Buffer.from(mnemonic);
    var hash = litecore.crypto.Hash.sha256(value);
    var bn = litecore.crypto.BN.fromBuffer(hash);

    var address = new litecore.PrivateKey(bn).toAddress();
    console.log(
      '%cMyProject%cline:45%caddress',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(179, 214, 110);padding:3px;border-radius:2px',
      address.toString()
    );

    const litecoinXprv = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: {
        public: 0x019da462,
        private: 0x019d9cfe,
      },
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
    };

    const bip32 = BIP32Factory(ecc);

    const seed = mnemonicToSeedSync(mnemonic);
    const bip32RootKey = bip32.fromSeed(seed, litecoinXprv);

    console.log(
      '%cMyProject%cline:69%cbip32RootKey',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(248, 214, 110);padding:3px;border-radius:2px',
      bip32RootKey.toBase58()
    );
    const keyPair = bitcoin.ECPair.fromWIF(bip32RootKey.toWIF(), litecoinXprv);
    console.log(
      '%cMyProject%cline:78%ckeyPair',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(254, 67, 101);padding:3px;border-radius:2px',
      keyPair.privateKey
    );

    const { address: address12 } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: litecoinXprv,
    });

    console.log(address12);

    // --------------------------------------------------------------------------------

    const privateKey = 'cS6Xqxi3ijJEzhTtnLgvMqbik9LwBNiWkQigT7QApLuo7XjrDYXK';
    const publicKey = 'mvMdYz62zbf8XLjChbKJuP6VZQZgRw2CA7';

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

    const sochain_network = 'LTCTEST';

    let { data: balance } = await axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);

    balance = balance.data.confirmed_balance;

    const nativeTokensBalance = balance;

    tokens.push(this.generateTokenObject(nativeTokensBalance, 'BTC', imagesURL + 'BTC.svg', 'native', btcToUSD.data.usd));

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
        this.convertTransactionToCommonFormat(el, Number(btcToUSD.data.usd), 'IN')
      )
    );

    transactions.push(
      ...resp.data.data.bitcoin.outputs.map((el: any) =>
        this.convertTransactionToCommonFormat(el, Number(btcToUSD.data.usd), 'OUT')
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
    const litecoinXprv = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bech32: 'ltc',
      bip32: {
        public: 0x019da462,
        private: 0x019d9cfe,
      },
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
    };

    const sochain_network = 'LTCTEST',
      privateKey = data.privateKey,
      sourceAddress = this.keys.publicKey,
      utxos = await axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`),
      transaction = new bitcoin.TransactionBuilder(litecoinXprv),
      amount = Math.trunc(data.amount * 1e8),
      privateKeyECpair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), { network: litecoinXprv });
    console.log(
      '%cMyProject%cline:231%cprivateKeyECpair',
      'color:#fff;background:#ee6f57;padding:3px;border-radius:2px',
      'color:#fff;background:#1f3c88;padding:3px;border-radius:2px',
      'color:#fff;background:rgb(1, 77, 103);padding:3px;border-radius:2px',
      privateKeyECpair
    );

    let totalInputsBalance = 0,
      fee = 0,
      inputCount = 1,
      outputCount = 2;

    transaction.setVersion(1);

    utxos.data.data.txs.sort((a: any, b: any) => {
      if (Number(a.value) > Number(b.number)) {
        return -1;
      } else if (Number(a.value) < Number(b.number)) {
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
      tokenName: 'BTC',
      timestamp: new Date(txData.block.timestamp.time).getTime(),
      fee: undefined,
      status: true,
      tokenLogo,
    };
  }
}