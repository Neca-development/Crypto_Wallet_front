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
exports.tronService = void 0;
const providers_1 = require("../constants/providers");
// @ts-ignore
const tronweb_1 = __importDefault(require("tronweb"));
// @ts-ignore
const bip39 = __importStar(require("bip39"));
const axios_1 = __importDefault(require("axios"));
const numbers_1 = require("../utils/numbers");
const bip32_1 = __importDefault(require("bip32"));
const ecc = __importStar(require("tiny-secp256k1"));
const bip32 = (0, bip32_1.default)(ecc);
const bignumber_js_1 = require("bignumber.js");
const providers_2 = require("./../constants/providers");
const providers_3 = require("./../constants/providers");
class tronService {
    constructor() {
        this.Tron = new tronweb_1.default(providers_1.tronWebProvider);
    }
    async generatePublicKey(privateKey) {
        const publicKey = await this.Tron.address.fromPrivateKey(privateKey);
        this.Tron.setPrivateKey(privateKey);
        return publicKey;
    }
    async generateKeyPair(mnemonic) {
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const node = await bip32.fromSeed(seed);
        const child = await node.derivePath("m/44'/195'/0'/0/0");
        const privateKey = await child.privateKey.toString('hex');
        const publicKey = await this.Tron.address.fromPrivateKey(privateKey);
        this.Tron.setPrivateKey(privateKey);
        return {
            privateKey,
            publicKey,
        };
    }
    async getTokensByAddress(address) {
        const tokens = [];
        const { data: trxToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/TRX`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        const nativeTokensBalance = await this.Tron.trx.getBalance(address);
        const USDTTokenBalance = await this.getCustomTokenBalance(address, providers_1.tronUSDTContractAddress);
        tokens.push(this.generateTokenObject(this.Tron.fromSun(nativeTokensBalance), 'TRX', providers_1.imagesURL + 'TRX.svg', 'native', trxToUSD.data.usd));
        tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', providers_1.imagesURL + 'USDT.svg', 'custom', trxToUSD.data.usd, trxToUSD.data.usdt, providers_1.tronUSDTContractAddress));
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenType) {
        const { data: trxToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/TRX`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        let value = tokenType == 'native' ? 10 : 10000000;
        value = value * 10e-10;
        const usd = Math.trunc(value * Number(trxToUSD.data.usd) * 100) / 100;
        return {
            value,
            usd: usd,
        };
    }
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize) {
        const { data: trxToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/TRX`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        const queries = [];
        let transactions = [];
        queries.push(this.generateTransactionsQuery(address, 'receiver'));
        queries.push(this.generateTransactionsQuery(address, 'sender'));
        for (const query of queries) {
            let { data: resp } = await axios_1.default.post(providers_3.bitqueryProxy, {
                body: { query: query, variables: {} },
            }, {
                headers: {
                    'auth-client-key': providers_2.backendApiKey,
                },
            });
            transactions.push(...resp.data.data.tron.outbound);
        }
        if (transactions.length === 0) {
            return { transactions: [], length: 0 };
        }
        transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(trxToUSD.data.usd)));
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
        this.Tron.setPrivateKey(data.privateKey);
        const address = this.Tron.address.toHex(data.receiverAddress);
        const result = await this.Tron.trx.sendTransaction(address, this.Tron.toSun(data.amount), data.privateKey);
        return result.txid;
    }
    async send20Token(data) {
        this.Tron.setPrivateKey(data.privateKey);
        const contract = await this.Tron.contract().at(data.cotractAddress);
        //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
        // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
        const result = await contract
            .transfer(data.receiverAddress, //address _to
        this.Tron.toSun(data.amount) //amount
        )
            .send({
            feeLimit: 10000000,
        });
        return result;
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    async getCustomTokenBalance(address, contractAddress) {
        const contract = await this.Tron.contract().at(contractAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(await contract.decimals().call());
        let balance = await contract.balanceOf(address).call();
        balance = new bignumber_js_1.BigNumber(balance.toNumber()).div(decimals);
        return balance.toNumber();
    }
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, trxToUSD, trxToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(trxToCustomToken)) * Number(trxToUSD) : Number(trxToUSD);
        tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;
        const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
        const standard = tokenType === 'custom' ? 'TRC 20' : null;
        return {
            standard,
            balance,
            balanceInUSD,
            contractAddress,
            tokenName,
            tokenType,
            tokenPriceInUSD,
            tokenLogo,
        };
    }
    generateTransactionsQuery(address, direction) {
        return `
      query{
      tron(network: tron) {
        outbound: transfers(
          ${direction}: {is: "${address}"},
          options: {desc: "any"}
          date: {after: "2021-12-01"}
          ) {
          txHash
          currency {
            symbol
            decimals
            address
            name
            tokenType
          }
          date {
            date(format: "YYYY.MM.DDThh:mm:ss")
            dayOfMonth
            year
            month
          }
          amount
          sender {
            address
          }
          receiver {
            address
          }
          fee
          success
          any(of: time)
        }
      }
    }
    `;
    }
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    convertTransactionToCommonFormat(txData, address, trxToUSD) {
        const tokenLogo = providers_1.imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
        const to = txData.receiver.address;
        const from = txData.sender.address;
        const amount = txData.amount;
        const direction = from === address ? 'OUT' : 'IN';
        const amountInUSD = txData.currency.symbol.toLowerCase() === 'trx' ? (Math.trunc(amount * trxToUSD * 100) / 100).toString() : amount;
        return {
            to,
            from,
            amount,
            amountInUSD,
            txId: txData.txHash,
            direction,
            type: txData.tokenType,
            tokenName: txData.currency.symbol,
            timestamp: new Date(txData.any).getTime(),
            fee: txData.fee,
            currencyFee: 'TRX',
            status: txData.success,
            tokenLogo,
        };
    }
}
exports.tronService = tronService;
//# sourceMappingURL=Tron.service.js.map