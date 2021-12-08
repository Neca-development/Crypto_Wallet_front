var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getBNFromDecimal, removeTrailingZeros } from '../utils/numbers';
import { etherScanApiKey, coinConverterApi, binanceScanApi, backendApi, backendApiKey } from '../constants/providers';
import { binanceWeb3Provider, binanceUSDTContractAddress } from '../constants/providers';
import { bnbUSDTAbi } from '../constants/bnb-USDT.abi';
// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
export class binanceService {
    constructor() {
        this.web3 = new Web3(binanceWeb3Provider);
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);
            this.web3.eth.accounts.wallet.add(this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey));
            this.web3.eth.defaultAccount = wallet.address;
            return {
                privateKey: wallet.privateKey,
                publicKey: wallet.address,
            };
        });
    }
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
            return address;
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            const { data: bnbToUSD } = yield axios.get(`${backendApi}coins/BNB`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const nativeTokensBalance = yield this.web3.eth.getBalance(address);
            const USDTTokenBalance = yield this.getCustomTokenBalance(address, binanceUSDTContractAddress);
            tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'BNB', 'native', bnbToUSD.data.usd));
            tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', 'custom', bnbToUSD.data.usd, bnbToUSD.data.usdt, binanceUSDTContractAddress));
            return tokens;
        });
    }
    getFeePriceOracle(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: bnbToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`);
            const fee = yield this.web3.eth.estimateGas({
                from,
                to,
            });
            let value = yield this.web3.eth.getGasPrice();
            value = (+this.web3.utils.fromWei(value) * fee).toString();
            const usd = Math.trunc(+value * bnbToUSD.ethereum.usd * 100) / 100;
            return {
                value,
                usd: usd.toString(),
            };
        });
    }
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            address = address.toLowerCase();
            const { data: bnbToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`);
            const transactions = [];
            const trxTransactions = yield this.getNormalTransactions(address, bnbToUSD.ethereum.usd);
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
            const gasPrice = yield this.web3.eth.getGasPrice();
            const gasCount = yield this.web3.eth.estimateGas({
                value: this.web3.utils.toWei(data.amount.toString()),
            });
            const result = yield this.web3.eth.sendTransaction({
                from: this.web3.eth.defaultAccount,
                to: data.receiverAddress,
                value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
                gasPrice: gasPrice,
                gas: gasCount,
            });
            return result.transactionHash;
        });
    }
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenAddress = data.cotractAddress;
            const contract = new this.web3.eth.Contract(bnbUSDTAbi, tokenAddress);
            const decimals = getBNFromDecimal(+(yield contract.methods._decimals().call()));
            const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
            const result = yield contract.methods
                .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
                .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
            console.log(result);
            return result.transactionHash;
        });
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    getCustomTokenBalance(address, contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new this.web3.eth.Contract(bnbUSDTAbi, contractAddress);
            const decimals = getBNFromDecimal(Number(yield contract.methods.decimals().call()));
            let balance = yield contract.methods.balanceOf(address).call();
            balance = new BigNumber(balance).dividedBy(decimals);
            return balance.toNumber();
        });
    }
    generateTokenObject(balance, tokenName, tokenType, bnbToUSD, bnbToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(bnbToUSD) : Number(bnbToUSD);
        tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;
        const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
        return {
            balance,
            balanceInUSD,
            contractAddress,
            tokenName,
            tokenType,
            tokenPriceInUSD,
        };
    }
    /**
     * @param {string} address:string
     * @param {number} bnbToUSD:number
     * @returns {Promise<ITransaction[]>}
     */
    getNormalTransactions(address, bnbToUSD) {
        return __awaiter(this, void 0, void 0, function* () {
            // get last 200  transactions
            const { data: transactions } = yield axios.get(`${binanceScanApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`);
            return transactions.result.map((transaction) => {
                return this.convertTransactionToCommonFormat(transaction, address, bnbToUSD);
            });
        });
    }
    /**
     * @param {string} address:string
     * @returns {Promise<ITransaction[]>}
     */
    getUSDTTransactions(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: transactions } = yield axios.get(`${binanceScanApi}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`);
            return transactions.result.map((transaction) => {
                return this.convertUSDTTransactionToCommonFormat(transaction, address);
            });
        });
    }
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    convertTransactionToCommonFormat(txData, address, bnbToUSD) {
        const to = txData.to, from = txData.from, amount = this.web3.utils.fromWei(txData.value), fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6), direction = from === address ? 'OUT' : 'IN', amountInUSD = (Math.trunc(+amount * bnbToUSD * 100) / 100).toString();
        return {
            to,
            from,
            amount,
            amountInUSD,
            txId: txData.hash,
            direction,
            tokenName: 'BNB',
            timestamp: +txData.timeStamp,
            fee,
        };
    }
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    convertUSDTTransactionToCommonFormat(txData, address) {
        const decimal = getBNFromDecimal(parseInt(txData.tokenDecimal, 10));
        const to = txData.to;
        const from = txData.from;
        const amountInBN = new BigNumber(txData.value);
        const amount = amountInBN.dividedBy(decimal).toFormat();
        const fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6);
        const direction = from === address ? 'OUT' : 'IN';
        return {
            to,
            from,
            amount: removeTrailingZeros(amount),
            amountInUSD: removeTrailingZeros(amount),
            txId: txData.hash,
            direction,
            tokenName: txData.tokenSymbol,
            timestamp: +txData.timeStamp,
            fee,
        };
    }
}
//# sourceMappingURL=Binance.service.js.map