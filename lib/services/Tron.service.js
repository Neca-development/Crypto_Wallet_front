var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { tronGridApi, tronScanApi, tronWebProvider, coinConverterApi } from '../constants/providers';
// @ts-ignore
import TronWeb from 'tronweb';
// @ts-ignore
import hdWallet from 'tron-wallet-hd';
import axios from 'axios';
import { getBNFromDecimal, removeTrailingZeros } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
export class tronService {
    constructor() {
        this.Tron = new TronWeb(tronWebProvider);
    }
    createWallet(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = (yield hdWallet.generateAccountsWithMnemonic(mnemonic, 1))[0];
            return {
                privateKey: data.privateKey,
                publicKey: data.address,
            };
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield axios.get(`${tronScanApi}/account?address=${address}`);
            const { data: trxToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`);
            const tokens = data.tokens.map((x) => {
                const tokenPriceInUSD = Math.trunc(x.tokenPriceInTrx * trxToUSD.tron.usd * 1000) / 1000;
                const balance = +this.Tron.fromSun(x.balance);
                const balanceInUSD = x.tokenAbbr.toLowerCase() === 'usdt'
                    ? Math.trunc(balance * 100) / 100
                    : Math.trunc(balance * trxToUSD.tron.usd * 100) / 100;
                return {
                    balance,
                    balanceInUSD,
                    tokenId: x.tokenId,
                    contractAddress: x.tokenId,
                    tokenAbbr: x.tokenAbbr,
                    tokenName: x.tokenName,
                    tokenType: x.tokenType,
                    tokenLogo: x.tokenLogo,
                    tokenPriceInUSD,
                };
            });
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
            const transactions = [];
            const trxTransactions = yield this.getTrxTransactions(address, trxToUSD.tron.usd);
            const usdtTransactions = yield this.getUSDTTransactions(address);
            transactions.push(...trxTransactions, ...usdtTransactions);
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
            yield this.Tron.trx.sendTransaction(address, this.Tron.toSun(data.amount), data.privateKey);
        });
    }
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Tron.setPrivateKey(data.privateKey);
            const contract = yield this.Tron.contract().at(data.cotractAddress);
            //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
            // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
            yield contract
                .transfer(data.receiverAddress, //address _to
            this.Tron.toSun(data.amount) //amount
            )
                .send({
                feeLimit: 10000000,
            });
        });
    }
    /**
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {Promise<ITransaction[]>}
     */
    getTrxTransactions(address, trxToUSD) {
        return __awaiter(this, void 0, void 0, function* () {
            // get last 200  transactions
            const { data: transactions } = yield axios.get(`${tronGridApi}/accounts/${address}/transactions?limit=200&fingerprint`);
            return transactions.data.map((transaction) => {
                return this.convertTransactionToCommonFormat(transaction, address, trxToUSD);
            });
        });
    }
    /**
     * @param {string} address:string
     * @returns {Promise<ITransaction[]>}
     */
    getUSDTTransactions(address) {
        return __awaiter(this, void 0, void 0, function* () {
            // get last 200  transactions
            const { data: transactions } = yield axios.get(`${tronGridApi}/accounts/${address}/transactions/trc20?limit=200&fingerprint`);
            return transactions.data.map((transaction) => {
                return this.convertUSDTTransactionToCommonFormat(transaction, address);
            });
        });
    }
    /**
     * 描述
     * @date 2021-11-20
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    convertTransactionToCommonFormat(txData, address, trxToUSD) {
        const to = this.Tron.address.fromHex(txData.raw_data.contract[0].parameter.value.to_address ||
            txData.raw_data.contract[0].parameter.value.contract_address);
        const from = this.Tron.address.fromHex(txData.raw_data.contract[0].parameter.value.owner_address);
        const type = txData.raw_data.contract[0].type;
        const amount = this.Tron.fromSun(txData.raw_data.contract[0].parameter.value.amount);
        const direction = from === address ? 'OUT' : 'IN';
        const amountInUSD = (Math.trunc(amount * trxToUSD * 100) / 100).toString();
        return {
            to,
            from,
            amount,
            amountInUSD,
            txId: txData.txID,
            direction,
            type,
            tokenName: 'TRX',
            timestamp: txData.block_timestamp,
            fee: 0,
        };
    }
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    convertUSDTTransactionToCommonFormat(txData, address) {
        const decimal = getBNFromDecimal(parseInt(txData.token_info.decimals, 10)), amountInBN = new BigNumber(txData.value), amount = amountInBN.dividedBy(decimal).toFormat(Number(txData.token_info.decimals)), direction = txData.to === address ? 'IN' : 'OUT';
        return {
            to: txData.to,
            from: txData.from,
            amount: removeTrailingZeros(amount),
            amountInUSD: removeTrailingZeros(amount),
            txId: txData.transaction_id,
            direction,
            tokenName: txData.token_info.symbol,
            timestamp: txData.block_timestamp,
            fee: 8,
        };
    }
}
//# sourceMappingURL=Tron.service.js.map