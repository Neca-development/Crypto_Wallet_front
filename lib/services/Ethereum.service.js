var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ethWeb3Provider, etherUSDTContractAddress, etherGasPrice, backendApi, imagesURL, bitqueryProxy, } from '../constants/providers';
import { backendApiKey } from './../constants/providers';
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
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
            return address;
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            const { data: ethToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const nativeTokensBalance = yield this.web3.eth.getBalance(address);
            const USDTTokenBalance = yield this.getCustomTokenBalance(address, etherUSDTContractAddress);
            tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'ETH', imagesURL + 'ETH.svg', 'native', ethToUSD.data.usd));
            tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', imagesURL + 'USDT.svg', 'custom', ethToUSD.data.usd, ethToUSD.data.usdt, etherUSDTContractAddress));
            return tokens;
        });
    }
    getFeePriceOracle(from) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: ethToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
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
            const usd = Math.trunc(+value * Number(ethToUSD.data.usd) * 100) / 100;
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
            const { data: ethToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
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
            transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), Number(ethToUSD.data.usdt)));
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
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    getCustomTokenBalance(address, contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new this.web3.eth.Contract(etherUSDTAbi, contractAddress);
            const decimals = getBNFromDecimal(Number(yield contract.methods.decimals().call()));
            let balance = yield contract.methods.balanceOf(address).call();
            balance = new BigNumber(balance).dividedBy(decimals);
            return balance.toNumber();
        });
    }
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, ethToUSD, ethToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(ethToCustomToken)) * Number(ethToUSD) : Number(ethToUSD);
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
        console.log(address);
        return `
      query{
      ethereum(network: ethereum) {
        transfers(
              options: {desc: "any", limit: 1000}
              amount: {gt: 0}
              ${direction}: {is: "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8"}
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
        let amountPriceInUSD = txData.currency.symbol === 'ETH' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * txData.amount * 100) / 100;
        const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
        const to = txData.address.address;
        const from = txData.sender.address;
        const direction = from === address.toLowerCase() ? 'OUT' : 'IN';
        return {
            to,
            from,
            amount,
            amountInUSD: amountPriceInUSD.toString(),
            txId: txData.txHash,
            direction,
            type: txData.tokenType,
            tokenName: txData.currency.symbol,
            timestamp: new Date(txData.any).getTime(),
            fee: txData.fee,
            status: txData.success,
            tokenLogo,
        };
    }
}
//# sourceMappingURL=Ethereum.service.js.map