var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { tronWebProvider, tronUSDTContractAddress, backendApi, imagesURL } from '../constants/providers';
import { coinConverterApi, bitqueryApi, bitqueryKey } from '../constants/providers';
// @ts-ignore
import TronWeb from 'tronweb';
// @ts-ignore
import hdWallet from 'tron-wallet-hd';
import axios from 'axios';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
import { backendApiKey } from './../constants/providers';
export class tronService {
    constructor() {
        this.Tron = new TronWeb(tronWebProvider);
    }
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield hdWallet.getAccountFromPrivateKey(privateKey);
            return data;
        });
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = (yield hdWallet.generateAccountsWithMnemonic(mnemonic, 1))[0];
            this.Tron.setPrivateKey(data.privateKey);
            return {
                privateKey: data.privateKey,
                publicKey: data.address,
            };
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            const { data: trxToUSD } = yield axios.get(`${backendApi}coins/TRX`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const nativeTokensBalance = yield this.Tron.trx.getBalance(address);
            const USDTTokenBalance = yield this.getCustomTokenBalance(address, tronUSDTContractAddress);
            tokens.push(this.generateTokenObject(this.Tron.fromSun(nativeTokensBalance), 'TRX', imagesURL + 'trx.svg', 'native', trxToUSD.data.usd));
            tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', imagesURL + 'usdt.svg', 'custom', trxToUSD.data.usd, trxToUSD.data.usdt, tronUSDTContractAddress));
            return tokens;
        });
    }
    getFeePriceOracle() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: trxToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`);
            let value = '10';
            const usd = Math.trunc(+value * trxToUSD.tron.usd * 100) / 100;
            return {
                value,
                usd: usd.toString(),
            };
        });
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: trxToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`);
            const receiverQuery = this.generateTransactionsQuery(address, 'receiver');
            const senderQuery = this.generateTransactionsQuery(address, 'sender');
            const { data: receivingTransactions } = yield axios.post(bitqueryApi, {
                query: receiverQuery,
                variables: {
                    id: 2,
                    city: 'Test',
                },
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': bitqueryKey,
                },
            });
            const { data: sendingTransactions } = yield axios.post(bitqueryApi, {
                query: senderQuery,
                variables: {
                    id: 2,
                    city: 'Test',
                },
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': bitqueryKey,
                },
            });
            let transactions = [
                ...receivingTransactions.data.tron.outbound,
                ...sendingTransactions.data.tron.outbound,
            ];
            transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, trxToUSD.tron.usd));
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
            this.Tron.setPrivateKey(data.privateKey);
            const address = this.Tron.address.toHex(data.receiverAddress);
            const result = yield this.Tron.trx.sendTransaction(address, this.Tron.toSun(data.amount), data.privateKey);
            return result.txid;
        });
    }
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Tron.setPrivateKey(data.privateKey);
            const contract = yield this.Tron.contract().at(data.cotractAddress);
            //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
            // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
            const result = yield contract
                .transfer(data.receiverAddress, //address _to
            this.Tron.toSun(data.amount) //amount
            )
                .send({
                feeLimit: 10000000,
            });
            return result;
        });
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    getCustomTokenBalance(address, contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = yield this.Tron.contract().at(contractAddress);
            const decimals = getBNFromDecimal(yield contract.decimals().call());
            let balance = yield contract.balanceOf(address).call();
            balance = new BigNumber(balance.toNumber()).div(decimals);
            return balance.toNumber();
        });
    }
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, trxToUSD, trxToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(trxToCustomToken)) * Number(trxToUSD) : Number(trxToUSD);
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
    generateTransactionsQuery(address, direction) {
        return `
      query{
      tron(network: tron) {
        outbound: transfers(${direction}: {is: "${address}"}, options: {desc: "any"}) {
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
            status: txData.success,
        };
    }
}
//# sourceMappingURL=Tron.service.js.map