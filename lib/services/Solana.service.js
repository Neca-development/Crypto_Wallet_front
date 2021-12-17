var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as solanaWeb3 from '@solana/web3.js';
import { Keypair, LAMPORTS_PER_SOL, Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import axios from "axios";
import { backendApi, backendApiKey, bitqueryProxy, imagesURL } from "../constants/providers";
export class solanaService {
    constructor() {
        this.connection = new Connection(clusterApiUrl('testnet'));
    }
    generateKeyPair(mnemonic) {
        const derivePath = "m/44'/501'/0'/0'";
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const derivedSeed = ed25519.derivePath(derivePath, seed.toString('hex')).key;
        this.address = Keypair.fromSeed(derivedSeed);
        return {
            privateKey: this.address.secretKey.toString(),
            publicKey: this.address.publicKey.toString()
        };
    }
    generatePublicKey(privateKey) {
        const arr = privateKey.split(',').map(Number);
        let secretKey = Uint8Array.from(arr);
        const address = Keypair.fromSecretKey(secretKey);
        // @ts-ignore
        return address.publicKey;
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            const { data: solToUSD } = yield axios.get(`${backendApi}coins/SOL`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const balance = yield this.connection.getBalance(new PublicKey(address));
            // const USDTTokenBalance = await this.connection.getTokenAccountBalance(new solanaWeb3.PublicKey(address))
            // console.log(USDTTokenBalance)
            const info = yield this.connection.getTokenAccountsByOwner(new PublicKey(address), { mint: new PublicKey('4KFsUz9t45VhPhJZTfzZAC3FuXkzwPu9vbAfKv4c71Ct') });
            console.log(info);
            tokens.push(this.generateTokenObject(balance / LAMPORTS_PER_SOL, 'SOL', imagesURL + 'SOL.svg', 'native', solToUSD.data.usd));
            return tokens;
        });
    }
    getFeePriceOracle(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(from, to);
            const { data: solToUSD } = yield axios.get(`${backendApi}coins/SOL`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const current_slot_time = 0.5;
            const feeInSol = current_slot_time * 0.00001;
            const usd = Math.trunc(feeInSol * Number(solToUSD.data.usd) * 100) / 100;
            return {
                value: feeInSol.toString(),
                usd: usd.toString()
            };
        });
    }
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = new solanaWeb3.Transaction().add(solanaWeb3.SystemProgram.transfer({
                fromPubkey: this.address.publicKey,
                toPubkey: new PublicKey(data.receiverAddress),
                lamports: data.amount * LAMPORTS_PER_SOL,
            }));
            const signature = yield solanaWeb3.sendAndConfirmTransaction(this.connection, transaction, [this.address]);
            return signature;
        });
    }
    send20Token(data) {
        console.log(data);
        return null;
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: solToUSD } = yield axios.get(`${backendApi}coins/SOL`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const queries = [];
            let transactions = [];
            queries.push(this.generateTransactionsQuery(address, 'receiver'));
            queries.push(this.generateTransactionsQuery(address, 'sender'));
            for (const query of queries) {
                let { data: resp } = yield axios.post(bitqueryProxy, {
                    body: { query: query, variables: {} },
                }, {
                    headers: {
                        'auth-client-key': backendApiKey,
                    },
                });
                transactions.push(...resp.data.data.solana.transfers);
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
            return transactions;
        });
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, solToUSD, solToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(solToCustomToken)) * Number(solToUSD) : Number(solToUSD);
        tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;
        const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
        return {
            balance,
            balanceInUSD,
            tokenName,
            tokenType,
            tokenPriceInUSD,
            tokenLogo,
            contractAddress
        };
    }
    generateTransactionsQuery(address, direction) {
        return `
      query{
      solana(network: solana) {
        transfers(
          options: {desc: "any", limit: 1000}
          ${direction}Address: {is: "PinYvHqMTZVrRTpwK9x3dB9vL7tsGtGedSz8EqeynuA"}
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
        const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
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
            status: txData.transaction.success,
            tokenLogo,
        };
    }
}
//# sourceMappingURL=Solana.service.js.map