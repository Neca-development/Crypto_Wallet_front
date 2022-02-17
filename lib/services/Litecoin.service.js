var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { imagesURL, backendApi, backendApiKey, bitqueryProxy, litecoinSatoshisPerByte } from '../constants/providers';
// @ts-ignore
import axios from 'axios';
import { mnemonicToSeedSync } from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { CustomError } from '../errors';
import coininfo from 'coininfo';
import { ErrorsTypes } from '../models/enums';
export class litecoinService {
    constructor() {
        this.network = coininfo.litecoin.main.toBitcoinJS();
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const seed = mnemonicToSeedSync(mnemonic);
            const root = bitcoin.bip32.fromSeed(seed, this.network).derivePath("m/44'/2'/0'/0/0");
            const keyPair = bitcoin.payments.p2pkh({ pubkey: root.publicKey, network: this.network });
            const privateKey = root.toWIF();
            const publicKey = keyPair.address;
            this.keys = {
                privateKey,
                publicKey,
            };
            return this.keys;
        });
    }
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const pubkey = bitcoin.ECPair.fromWIF(privateKey, this.network).publicKey;
            const publicKey = bitcoin.payments.p2pkh({ pubkey, network: this.network }).address;
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
            let ltcToUSD;
            try {
                ltcToUSD = (yield axios.get(`${backendApi}coins/LTC`, {
                    headers: {
                        'auth-client-key': backendApiKey,
                    },
                })).data;
            }
            catch (error) {
                console.log('server was dropped');
            }
            const sochain_network = 'LTC';
            let { data: balance } = yield axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);
            balance = balance.data.confirmed_balance;
            const nativeTokensBalance = balance;
            tokens.push(this.generateTokenObject(nativeTokensBalance, 'LTC', imagesURL + 'LTC.svg', 'native', ltcToUSD.data.usd));
            return tokens;
        });
    }
    getFeePriceOracle(from, to, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            amount = Math.trunc(amount * 1e8);
            const sochain_network = 'LTC', sourceAddress = from, utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);
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
                fee = (inputCount * 146 + outputCount * 33 + 10) * litecoinSatoshisPerByte;
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
            const ltcToUSD = (yield axios.get(`${backendApi}coins/LTC`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            })).data;
            const usd = Math.trunc(Number(ltcToUSD.data.usd) * value * 100) / 100;
            return {
                value,
                usd,
            };
        });
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: ltcToUSD } = yield axios.get(`${backendApi}coins/LTC`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            let transactions = [];
            let { data: resp } = yield axios.post(bitqueryProxy, {
                body: {
                    query: `
          query {
            bitcoin(network: litecoin) {
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
            transactions.push(...resp.data.data.bitcoin.inputs.map((el) => this.convertTransactionToCommonFormat(el, Number(ltcToUSD.data.usd), 'IN')));
            transactions.push(...resp.data.data.bitcoin.outputs.map((el) => this.convertTransactionToCommonFormat(el, Number(ltcToUSD.data.usd), 'OUT')));
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
            const sochain_network = 'LTC', privateKey = data.privateKey, sourceAddress = this.keys.publicKey, utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`), 
            // @ts-ignore
            transaction = new bitcoin.TransactionBuilder(this.network), amount = Math.trunc(data.amount * 1e8), privateKeyECpair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), {
                // @ts-ignore
                network: this.network,
            });
            let totalInputsBalance = 0, fee = 0, inputCount = 0, outputCount = 2;
            transaction.setVersion(1);
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
                fee = (inputCount * 146 + outputCount * 33 + 10) * litecoinSatoshisPerByte;
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
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, ltcToUSD, bnbToCustomToken, contractAddress) {
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
    convertTransactionToCommonFormat(txData, tokenPriceToUSD, direction) {
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
//# sourceMappingURL=Litecoin.service.js.map