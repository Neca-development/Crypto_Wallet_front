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
exports.solanaService = void 0;
const solanaWeb3 = __importStar(require("@solana/web3.js"));
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bip39 = __importStar(require("bip39"));
const ed25519 = __importStar(require("ed25519-hd-key"));
const axios_1 = __importDefault(require("axios"));
const providers_1 = require("../constants/providers");
class solanaService {
    constructor() {
        this.connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('mainnet-beta'));
    }
    async generateKeyPair(mnemonic) {
        const derivePath = "m/44'/501'/0'/0'";
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const derivedSeed = ed25519.derivePath(derivePath, seed.toString('hex')).key;
        this.address = web3_js_1.Keypair.fromSeed(derivedSeed);
        return {
            privateKey: this.address.secretKey.toString(),
            publicKey: this.address.publicKey.toString(),
        };
    }
    generatePublicKey(privateKey) {
        const arr = privateKey.split(',').map(Number);
        let secretKey = Uint8Array.from(arr);
        const address = web3_js_1.Keypair.fromSecretKey(secretKey);
        // @ts-ignore
        return address.publicKey;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        const { data: solToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/SOL`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const balance = await this.connection.getBalance(new web3_js_1.PublicKey(address));
        tokens.push(this.generateTokenObject(balance / web3_js_1.LAMPORTS_PER_SOL, 'SOL', providers_1.imagesURL + 'SOL.svg', 'native', solToUSD.data.usd));
        // USDT Balance
        const info = await this.connection.getTokenAccountsByOwner(new web3_js_1.PublicKey(address), {
            mint: new web3_js_1.PublicKey(providers_1.solanaUSDTContractAddress),
        });
        let USDTTokenBalance;
        if (info.value[0]) {
            const tokenBalance = await this.connection.getTokenAccountBalance(new solanaWeb3.PublicKey(info.value[0].pubkey));
            USDTTokenBalance = tokenBalance.value.uiAmount;
        }
        else {
            USDTTokenBalance = 0;
        }
        tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', providers_1.imagesURL + 'USDT.svg', 'custom', solToUSD.data.usd, solToUSD.data.usdt, providers_1.solanaUSDTContractAddress));
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenTypes) {
        const { data: solToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/SOL`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const current_slot_time = 0.5;
        const feeInSol = tokenTypes == 'native' ? current_slot_time * 0.00001 : null;
        const usd = Math.trunc(feeInSol * Number(solToUSD.data.usd) * 100) / 100;
        return {
            value: feeInSol,
            usd: usd,
        };
    }
    async sendMainToken(data) {
        const transaction = new solanaWeb3.Transaction().add(solanaWeb3.SystemProgram.transfer({
            fromPubkey: this.address.publicKey,
            toPubkey: new web3_js_1.PublicKey(data.receiverAddress),
            lamports: data.amount * web3_js_1.LAMPORTS_PER_SOL,
        }));
        const signature = await solanaWeb3.sendAndConfirmTransaction(this.connection, transaction, [this.address]);
        return signature;
    }
    async send20Token(data) {
        const mintToken = new spl_token_1.Token(this.connection, new web3_js_1.PublicKey(data.cotractAddress), spl_token_1.TOKEN_PROGRAM_ID, this.address);
        const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(this.address.publicKey);
        const receiverAddress = new web3_js_1.PublicKey(data.receiverAddress);
        const toTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(receiverAddress);
        const transaction = new solanaWeb3.Transaction().add(spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, fromTokenAccount.address, toTokenAccount.address, this.address.publicKey, [], data.amount * 100));
        const signature = await solanaWeb3.sendAndConfirmTransaction(this.connection, transaction, [this.address], {
            commitment: 'confirmed',
        });
        return signature;
    }
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize) {
        const { data: solToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/SOL`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const queries = [];
        let transactions = [];
        queries.push(this.generateTransactionsQuery(address, 'receiver'));
        queries.push(this.generateTransactionsQuery(address, 'sender'));
        for (const query of queries) {
            let { data: resp } = await axios_1.default.post(providers_1.bitqueryProxy, {
                body: { query: query, variables: {} },
            }, {
                headers: {
                    'auth-client-key': providers_1.backendApiKey,
                },
            });
            transactions.push(...resp.data.data.solana.transfers);
        }
        if (transactions.length === 0) {
            return { transactions: [], length: 0 };
        }
        transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(solToUSD.data.usd)));
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
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, solToUSD, solToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(solToCustomToken)) * Number(solToUSD) : Number(solToUSD);
        tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;
        const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
        const standard = tokenType === 'custom' ? 'SPL Token' : null;
        return {
            standard,
            balance,
            balanceInUSD,
            tokenName,
            tokenType,
            tokenPriceInUSD,
            tokenLogo,
            contractAddress,
        };
    }
    generateTransactionsQuery(address, direction) {
        return `
      query{
      solana(network: solana) {
        transfers(
          options: {desc: "any", limit: 1000}
          ${direction}Address: {is: "PinYvHqMTZVrRTpwK9x3dB9vL7tsGtGedSz8EqeynuA"}
          date: {after: "2021-12-01"}
        ) {
          any(of: time)
          receiver {
            address
          }
          sender {
            address
          }
          transaction {
            fee
            transactionIndex
            success
          }
          currency {
            symbol
            name
            tokenType
          }
          amount
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
        const amountInUSD = txData.currency.symbol.toLowerCase() === 'sol' ? (Math.trunc(amount * trxToUSD * 100) / 100).toString() : amount;
        return {
            to,
            from,
            amount,
            amountInUSD,
            txId: txData.transaction.transactionIndex,
            direction,
            type: txData.currency.tokenType,
            tokenName: txData.currency.symbol,
            timestamp: new Date(txData.any).getTime(),
            fee: txData.transaction.fee,
            currencyFee: 'SOL',
            status: txData.transaction.success,
            tokenLogo,
        };
    }
}
exports.solanaService = solanaService;
//# sourceMappingURL=Solana.service.js.map