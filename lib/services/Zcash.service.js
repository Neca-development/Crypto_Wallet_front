var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { imagesURL, backendApi, backendApiKey, bitqueryProxy, dashSatoshisPerByte } from '../constants/providers';
// @ts-ignore
import axios from 'axios';
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
export class zcashService {
    constructor() { }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let dashToUSD;
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
            }
            catch (error) {
                console.log('server was dropped');
            }
            const sochain_network = '	ZEC';
            let { data: balance } = yield axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);
            balance = balance.data.confirmed_balance;
            const nativeTokensBalance = balance;
            tokens.push(this.generateTokenObject(nativeTokensBalance, '	ZEC', imagesURL + '	ZEC.svg', 'native', dashToUSD.data.usd));
            return tokens;
        });
    }
    getFeePriceOracle(from, to, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            amount = Math.trunc(amount * 1e8);
            const sochain_network = '	ZEC', sourceAddress = from, utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);
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
                fee = (inputCount * 146 + outputCount * 33 + 10) * 20 * dashSatoshisPerByte;
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
        });
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
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
            let { data: resp } = yield axios.post(bitqueryProxy, {
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
            }, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            transactions.push(...resp.data.data.bitcoin.inputs.map((el) => this.convertTransactionToCommonFormat(el, Number(dashToUSD.data.usd), 'IN')));
            transactions.push(...resp.data.data.bitcoin.outputs.map((el) => this.convertTransactionToCommonFormat(el, Number(dashToUSD.data.usd), 'OUT')));
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
            console.log('%cMyProject%cline:250%cnetGain', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(130, 57, 53);padding:3px;border-radius:2px', netGain);
            const sochain_network = 'ZEC', privateKey = data.privateKey, sourceAddress = this.keys.publicKey, utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`), 
            // @ts-ignore
            transaction = new utxolib.bitgo.createTransactionBuilderForNetwork(netGain), amount = Math.trunc(data.amount * 1e8);
            console.log(transaction);
            let privateKeyECpair = bitcoin.ECPair.fromWIF(privateKey, netGain);
            let totalInputsBalance = 0, fee = 0, inputCount = 0, outputCount = 2;
            transaction.setVersion(1);
            console.log(utxos);
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
                fee = (inputCount * 146 + outputCount * 33 + 10) * 20 * dashSatoshisPerByte * 10;
                console.log(fee);
                if (totalInputsBalance - amount - fee > 0) {
                    return;
                }
                transaction.addInput(element.txid, element.output_no);
                inputCount += 1;
                totalInputsBalance += Math.floor(Number(element.value) * 100000000);
            }));
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
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, dashToUSD, bnbToCustomToken, contractAddress) {
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
    convertTransactionToCommonFormat(txData, tokenPriceToUSD, direction) {
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
//# sourceMappingURL=Zcash.service.js.map