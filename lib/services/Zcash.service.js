var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { imagesURL, backendApi, backendApiKey, bitqueryProxy, zcashSatoshisPerByte } from '../constants/providers';
// @ts-ignore
import axios from 'axios';
// @ts-ignore
import zcashcore from 'zcash-bitcore-lib';
import { mnemonicToSeedSync } from 'bip39';
import * as utxolib from '@bitgo/utxo-lib';
import { CustomError } from '../errors';
import coininfo from 'coininfo';
import { ErrorsTypes } from '../models/enums';
export class zcashService {
    constructor() {
        this.network = utxolib.networks.zcash;
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKey = zcashcore.PrivateKey(privateKey).toAddress().toString();
            this.keys = {
                privateKey,
                publicKey,
            };
            return publicKey;
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            let zcashToUSD;
            try {
                zcashToUSD = (yield axios.get(`${backendApi}coins/ZEC`, {
                    headers: {
                        'auth-client-key': backendApiKey,
                    },
                })).data;
            }
            catch (error) {
                console.log('server was dropped');
            }
            const sochain_network = 'ZEC';
            let { data: balance } = yield axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);
            balance = balance.data.confirmed_balance;
            const nativeTokensBalance = balance;
            tokens.push(this.generateTokenObject(nativeTokensBalance, 'ZEC', imagesURL + 'ZEC.svg', 'native', zcashToUSD.data.usd));
            return tokens;
        });
    }
    getFeePriceOracle(from, to, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            amount = Math.trunc(amount * 1e8);
            const sochain_network = 'ZEC', sourceAddress = from, utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);
            let totalInputsBalance = 0, fee = 0, inputCount = 0, outputCount = 2;
            utxos.data.data.txs.sort((a, b) => {
                if (Number(a.value) > Number(b.value)) {
                    return -1;
                }
                else if (Number(a.value) < Number(b.value)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            utxos.data.data.txs.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                fee = (inputCount * 146 + outputCount * 33 + 10) * zcashSatoshisPerByte;
                if (totalInputsBalance - amount - fee > 0) {
                    return;
                }
                inputCount += 1;
                totalInputsBalance += Math.floor(Number(element.value) * 100000000);
            }));
            if (totalInputsBalance - amount - fee < 0) {
                throw new Error('Balance is too low for this transaction');
            }
            const value = fee * 1e-8;
            const { data: zcashToUSD } = yield axios.get(`${backendApi}coins/ZEC`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const usd = Math.trunc(Number(zcashToUSD.data.usd) * value * 100) / 100;
            return {
                value,
                usd,
            };
        });
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: zcashToUSD } = yield axios.get(`${backendApi}coins/ZEC`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            let transactions = [];
            let { data: resp } = yield axios.post(bitqueryProxy, {
                body: {
                    query: `
          query {
            bitcoin(network: zcash) {
              outputs(outputAddress: {is: "${address}"}
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
            }, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            transactions.push(...resp.data.data.bitcoin.inputs.map((el) => this.convertTransactionToCommonFormat(el, Number(zcashToUSD.data.usd), 'IN')));
            transactions.push(...resp.data.data.bitcoin.outputs.map((el) => this.convertTransactionToCommonFormat(el, Number(zcashToUSD.data.usd), 'OUT')));
            if (transactions.length === 0) {
                return [];
            }
            transactions.sort((a, b) => {
                if (a.timestamp > b.timestamp) {
                    return -1;
                }
                else if (a.timestamp < b.timestamp) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            return transactions;
        });
    }
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let netGain = utxolib.networks.zcash;
            const sochain_network = 'ZEC', privateKey = data.privateKey, sourceAddress = this.keys.publicKey, amount = Math.trunc(data.amount * 1e8), keyPair = utxolib.ECPair.fromWIF(privateKey, netGain), 
            // @ts-ignore
            transaction = new utxolib.bitgo.ZcashTransactionBuilder(netGain), utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);
            transaction.setVersion(utxolib.bitgo.ZcashTransaction.VERSION_SAPLING);
            transaction.setVersionGroupId(parseInt('0x892F2085', 16));
            let totalInputsBalance = 0, fee = 0, inputCount = 0, outputCount = 2;
            utxos.data.data.txs.sort((a, b) => {
                if (Number(a.value) > Number(b.value)) {
                    return -1;
                }
                else if (Number(a.value) < Number(b.value)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            utxos.data.data.txs.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                fee = (inputCount * 146 + outputCount * 33 + 10) * zcashSatoshisPerByte;
                if (totalInputsBalance - amount - fee > 0) {
                    return;
                }
                transaction.addInput(element.txid, element.output_no);
                inputCount += 1;
                totalInputsBalance += Math.floor(Number(element.value) * 1e8);
            }));
            if (totalInputsBalance - amount - fee < 0) {
                throw new Error('Balance is too low for this transaction');
            }
            transaction.addOutput(data.receiverAddress, amount);
            transaction.addOutput(sourceAddress, totalInputsBalance - amount - fee);
            for (let i = 0; i < inputCount; i++) {
                transaction.sign(i, keyPair, null, utxolib.bitgo.ZcashTransaction.SIGHASH_ALL, Number(utxos.data.data.txs[i].value) * 1e8);
            }
            const { data: trRequest } = yield axios.post(`${backendApi}transactions/so-chain/${sochain_network}`, {
                tx_hex: transaction.buildIncomplete().toHex(),
            }, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            return trRequest.data.txid;
        });
    }
    send20Token() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new CustomError('Network doesnt support this method', 14, ErrorsTypes['Unknown error']);
        });
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, zcashToUSD, bnbToCustomToken, contractAddress) {
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
    convertTransactionToCommonFormat(txData, tokenPriceToUSD, direction) {
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
//# sourceMappingURL=Zcash.service.js.map