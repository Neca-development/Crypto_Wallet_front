"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zcashService = void 0;
const providers_1 = require("../constants/providers");
// @ts-ignore
const axios_1 = __importDefault(require("axios"));
const zcashAddress = __importStar(require("@bitgo/utxo-lib/dist/src/bitgo/zcash/address"));
const bip39_1 = require("bip39");
const utxolib = __importStar(require("@bitgo/utxo-lib"));
const errors_1 = require("../errors");
const enums_1 = require("../models/enums");
class zcashService {
    constructor() {
        this.network = utxolib.networks.zcash;
    }
    async generateKeyPair(mnemonic) {
        const seed = (0, bip39_1.mnemonicToSeedSync)(mnemonic);
        const root = utxolib.bip32.fromSeed(seed, this.network).derivePath("m/44'/133'/0'/0/0");
        const keyPair1 = utxolib.bitgo.keyutil.privateKeyBufferToECPair(root.privateKey, this.network);
        const publicKeyHash160 = utxolib.crypto.hash160(keyPair1.publicKey);
        const privateKey = root.toWIF();
        const publicKey = zcashAddress.toBase58Check(publicKeyHash160, 7352);
        this.keys = {
            privateKey,
            publicKey,
        };
        return this.keys;
    }
    async generatePublicKey(privateKey) {
        const ECPair = utxolib.ECPair.fromWIF(privateKey);
        const publickKeyHash = utxolib.crypto.hash160(ECPair.publicKey);
        const publicKey = zcashAddress.toBase58Check(publickKeyHash, 7352);
        this.keys = {
            privateKey,
            publicKey,
        };
        return publicKey;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        let zcashToUSD;
        try {
            zcashToUSD = (await axios_1.default.get(`${providers_1.backendApi}coins/ZEC`, {
                headers: {
                    'auth-client-key': providers_1.backendApiKey,
                },
            })).data;
        }
        catch (error) {
            console.log('server was dropped');
        }
        const sochain_network = 'ZEC';
        let { data: balance } = await axios_1.default.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);
        balance = balance.data.confirmed_balance;
        const nativeTokensBalance = balance;
        tokens.push(this.generateTokenObject(nativeTokensBalance, 'ZEC', providers_1.imagesURL + 'ZEC.svg', 'native', zcashToUSD.data.usd));
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenTypes) {
        amount = Math.trunc(amount * 1e8);
        const sochain_network = 'ZEC', sourceAddress = from, utxos = await axios_1.default.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);
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
        utxos.data.data.txs.forEach(async (element) => {
            fee = (inputCount * 146 + outputCount * 33 + 10) * providers_1.zcashSatoshisPerByte;
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
        const { data: zcashToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/ZEC`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const usd = Math.trunc(Number(zcashToUSD.data.usd) * value * 100) / 100;
        return {
            value,
            usd,
        };
    }
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize) {
        const { data: zcashToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/ZEC`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        let transactions = [];
        let { data: resp } = await axios_1.default.post(providers_1.bitqueryProxy, {
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
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        transactions.push(...resp.data.data.bitcoin.inputs.map((el) => this.convertTransactionToCommonFormat(el, Number(zcashToUSD.data.usd), 'IN')));
        transactions.push(...resp.data.data.bitcoin.outputs.map((el) => this.convertTransactionToCommonFormat(el, Number(zcashToUSD.data.usd), 'OUT')));
        if (transactions.length === 0) {
            return { transactions: [], length: 0 };
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
        const length = transactions.length;
        if (pageNumber || pageNumber === 0) {
            transactions = transactions.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        }
        return {
            transactions, length
        };
    }
    async sendMainToken(data) {
        let netGain = utxolib.networks.zcash;
        const sochain_network = 'ZEC', privateKey = data.privateKey, sourceAddress = this.keys.publicKey, amount = Math.trunc(data.amount * 1e8), 
        //@ts-ignore
        keyPair = utxolib.ECPair.fromWIF(privateKey, netGain), 
        // @ts-ignore
        transaction = new utxolib.bitgo.ZcashTransactionBuilder(netGain), utxos = await axios_1.default.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);
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
        utxos.data.data.txs.forEach(async (element) => {
            fee = (inputCount * 146 + outputCount * 33 + 10) * providers_1.zcashSatoshisPerByte;
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
        const { data: trRequest } = await axios_1.default.post(`${providers_1.backendApi}transactions/so-chain/${sochain_network}`, {
            tx_hex: transaction.buildIncomplete().toHex(),
        }, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        return trRequest.data.txid;
    }
    async send20Token() {
        throw new errors_1.CustomError('Network doesnt support this method', 14, enums_1.ErrorsTypes['Unknown error']);
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
        const tokenLogo = providers_1.imagesURL + tokenName + '.svg';
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
            currencyFee: 'ZEC',
            status: true,
            tokenLogo,
        };
    }
}
exports.zcashService = zcashService;
//# sourceMappingURL=Zcash.service.js.map