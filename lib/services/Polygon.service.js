var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getBNFromDecimal } from '../utils/numbers';
import { backendApi, backendApiKey, bitqueryProxy, imagesURL, polygonGasPrice } from '../constants/providers';
import { polygonWeb3Provider, polygonUSDTContractAddress } from '../constants/providers';
import { maticUSDTAbi } from '../constants/matic-USDT.abi';
// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
export class polygonService {
    constructor() {
        this.web3 = new Web3(polygonWeb3Provider);
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
            const { data: maticToUSD } = yield axios.get(`${backendApi}coins/MATIC`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const nativeTokensBalance = yield this.web3.eth.getBalance(address);
            const USDTTokenBalance = yield this.getCustomTokenBalance(address, polygonUSDTContractAddress);
            tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'MATIC', imagesURL + 'MATIC.svg', 'native', maticToUSD.data.usd));
            tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', imagesURL + 'USDT.svg', 'custom', maticToUSD.data.usd, maticToUSD.data.usdt, polygonUSDTContractAddress));
            return tokens;
        });
    }
    getFeePriceOracle(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: maticToUSD } = yield axios.get(`${backendApi}coins/MATIC`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const estimatedGas = yield this.web3.eth.estimateGas({
                from,
                to,
            });
            const { data: gasPrice } = yield axios.get(polygonGasPrice);
            const transactionFee = (estimatedGas * gasPrice.standard) / 1000000000;
            const usd = Math.trunc(transactionFee * Number(maticToUSD.data.usd) * 100) / 100;
            return {
                value: transactionFee,
                usd: usd,
            };
        });
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: maticToUSD } = yield axios.get(`${backendApi}coins/MATIC`, {
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
                transactions.push(...resp.data.data.ethereum.transfers);
            }
            if (transactions.length === 0) {
                return [];
            }
            transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(maticToUSD.data.usd), Number(maticToUSD.data.usdt)));
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
            const { data: gasPrice } = yield axios.get(polygonGasPrice);
            const gasCount = yield this.web3.eth.estimateGas({
                value: this.web3.utils.toWei(data.amount.toString()),
            });
            const result = yield this.web3.eth.sendTransaction({
                from: this.web3.eth.defaultAccount,
                to: data.receiverAddress,
                value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
                gasPrice: gasPrice.standard * 1000000000,
                gas: gasCount,
            });
            return result.transactionHash;
        });
    }
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenAddress = data.cotractAddress;
            const contract = new this.web3.eth.Contract(maticUSDTAbi, tokenAddress);
            const decimals = getBNFromDecimal(+(yield contract.methods.decimals().call()));
            const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
            const result = yield contract.methods
                .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
                .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
            return result.transactionHash;
        });
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    getCustomTokenBalance(address, contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new this.web3.eth.Contract(maticUSDTAbi, contractAddress);
            const decimals = getBNFromDecimal(Number(yield contract.methods.decimals().call()));
            let balance = yield contract.methods.balanceOf(address).call();
            balance = new BigNumber(balance).dividedBy(decimals);
            return balance.toNumber();
        });
    }
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, maticToUSD, maticToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(maticToCustomToken)) * Number(maticToUSD) : Number(maticToUSD);
        tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;
        const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
        const standard = tokenType === 'custom' ? 'ERC 20' : null;
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
      ethereum(network: matic) {
        transfers(
              options: {desc: "any", limit: 1000}
              amount: {gt: 0}
              ${direction}: {is: "${address}"}
              date: {after: "2021-12-01"}
            ) {
              any(of: time)
              address: receiver {
                address
                annotation
              }
              sender {
                address
              }
              currency {
                address
                symbol
              }
              amount
              transaction {
                hash
                gasPrice
                gas
              }
              external
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
    convertTransactionToCommonFormat(txData, address, tokenPriceToUSD, nativeTokenToUSD) {
        const amount = new BigNumber(txData.amount).toFormat();
        let amountPriceInUSD = txData.currency.symbol === 'MATIC' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * txData.amount * 100) / 100;
        const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
        const to = txData.address.address;
        const from = txData.sender.address;
        const direction = from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN';
        const fee = (txData.transaction.gas * txData.transaction.gasPrice) / 1000000000;
        return {
            to,
            from,
            amount,
            amountInUSD: amountPriceInUSD.toString(),
            txId: txData.transaction.hash,
            direction,
            type: txData.tokenType,
            tokenName: txData.currency.symbol,
            timestamp: new Date(txData.any).getTime(),
            fee: +fee.toFixed(5),
            status: txData.success,
            tokenLogo,
        };
    }
}
//# sourceMappingURL=Polygon.service.js.map