var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// import { Transaction } from '@ethereumjs/tx';
import { etherScanApi, etherScanApiKey, ethWeb3Provider, coinConverterApi, etherUSDTContractAddress, etherGasPrice, } from '../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';
// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ethers } from 'ethers';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
export class ethereumService {
    constructor() {
        this.web3 = new Web3(ethWeb3Provider);
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
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            const { data: ethToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`);
            const { data: mainToken } = yield axios.get(`${etherScanApi}?module=account&action=balance&address=${address}&tag=latest&apikey=${etherScanApiKey}`);
            const mainTokenBalanceInUSD = Math.trunc(+this.web3.utils.fromWei(mainToken.result) * ethToUSD.ethereum.usd * 100) / 100;
            tokens.push({
                balance: +this.web3.utils.fromWei(mainToken.result),
                balanceInUSD: mainTokenBalanceInUSD,
                tokenId: '_',
                contractAddress: '_',
                tokenAbbr: 'ETH',
                tokenName: 'ETH',
                tokenType: 'mainToken',
                tokenLogo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880',
                tokenPriceInUSD: ethToUSD.ethereum.usd,
            });
            const contract = new this.web3.eth.Contract(etherUSDTAbi, etherUSDTContractAddress);
            const result = yield contract.methods.balanceOf(address).call();
            const decimals = getBNFromDecimal(parseInt(yield contract.methods.decimals().call(), 10));
            const balance = new BigNumber(result).div(decimals).toNumber();
            const USDTbalanceInUSD = Math.trunc(balance * 100) / 100;
            tokens.push({
                balance,
                balanceInUSD: USDTbalanceInUSD,
                tokenId: '_',
                contractAddress: etherUSDTContractAddress,
                tokenAbbr: 'USDT',
                tokenName: 'USD Tether',
                tokenType: 'smartToken',
                tokenLogo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
                tokenPriceInUSD: 1,
            });
            return tokens;
        });
    }
    getFeePriceOracle(from) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: ethToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`);
            const fee = yield this.web3.eth.estimateGas({
                from,
                value: this.web3.utils.toWei('1'),
            });
            let { data: price } = yield axios.get(etherGasPrice);
            console.log(price);
            price = price.fast / 10000000000;
            console.log({ price, fee });
            const value = (price.fast * fee).toString();
            console.log(value);
            const usd = Math.trunc(+value * ethToUSD.ethereum.usd * 100) / 100;
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
            const { data: ethToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`);
            const transactions = [];
            const trxTransactions = yield this.getNormalTransactions(address, ethToUSD.ethereum.usd);
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
            // let gasPrice = await this.web3.eth.getGasPrice();
            // let gasCount = Math.trunc(+this.web3.utils.toWei(data.fee) / +gasPrice);
            const result = yield this.web3.eth.sendTransaction({
                from: this.web3.eth.defaultAccount,
                to: data.receiverAddress,
                value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
            });
            console.log(result);
            return result.transactionHash;
        });
    }
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenAddress = data.cotractAddress;
            const contract = new this.web3.eth.Contract(etherUSDTAbi, tokenAddress);
            const decimals = getBNFromDecimal(+(yield contract.methods.decimals().call()));
            const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
            const result = yield contract.methods
                .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
                .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
            console.log(result);
            return result.transactionHash;
        });
    }
    getTokenContractAddress(tokens, tokenAbbr) {
        const token = tokens.find((x) => x.tokenAbbr === tokenAbbr);
        return token.tokenId;
    }
    /**
     * @param {string} address:string
     * @param {number} ethToUSD:number
     * @returns {Promise<ITransaction[]>}
     */
    getNormalTransactions(address, ethToUSD) {
        return __awaiter(this, void 0, void 0, function* () {
            // get last 200  transactions
            const { data: transactions } = yield axios.get(`${etherScanApi}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`);
            return transactions.result.map((transaction) => {
                return this.convertTransactionToCommonFormat(transaction, address, ethToUSD);
            });
        });
    }
    /**
     * @param {string} address:string
     * @returns {Promise<ITransaction[]>}
     */
    getUSDTTransactions(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: transactions } = yield axios.get(`${etherScanApi}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&apikey=${etherScanApiKey}`);
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
    convertTransactionToCommonFormat(txData, address, ethToUSD) {
        const to = txData.to, from = txData.from, amount = this.web3.utils.fromWei(txData.value), fee = +(+this.web3.utils.fromWei((txData.gasUsed * txData.gasPrice).toString())).toFixed(6), direction = from === address ? 'OUT' : 'IN', amountInUSD = (Math.trunc(+amount * ethToUSD * 100) / 100).toString();
        return {
            to,
            from,
            amount,
            amountInUSD,
            txId: txData.hash,
            direction,
            tokenName: 'ETH',
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
            amount,
            amountInUSD: amount,
            txId: txData.hash,
            direction,
            tokenName: txData.tokenSymbol,
            timestamp: +txData.timeStamp,
            fee,
        };
    }
}
//# sourceMappingURL=Ethereum.service.js.map