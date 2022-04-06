"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.binanceService = void 0;
const numbers_1 = require("../utils/numbers");
const providers_1 = require("../constants/providers");
const providers_2 = require("../constants/providers");
const bnb_USDT_abi_1 = require("../constants/bnb-USDT.abi");
// @ts-ignore
const axios_1 = __importDefault(require("axios"));
const web3_1 = __importDefault(require("web3"));
const ethers_1 = require("ethers");
const bignumber_js_1 = require("bignumber.js");
class binanceService {
    constructor() {
        this.web3 = new web3_1.default(providers_2.binanceWeb3Provider);
    }
    async generateKeyPair(mnemonic) {
        const wallet = ethers_1.ethers.Wallet.fromMnemonic(mnemonic);
        this.web3.eth.accounts.wallet.add(this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey));
        this.web3.eth.defaultAccount = wallet.address;
        return {
            privateKey: wallet.privateKey,
            publicKey: wallet.address,
        };
    }
    async generatePublicKey(privateKey) {
        const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        return address;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        const { data: bnbToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/BNB`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const nativeTokensBalance = await this.web3.eth.getBalance(address);
        const USDTTokenBalance = await this.getCustomTokenBalance(address, providers_2.binanceUSDTContractAddress);
        tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'BNB', providers_1.imagesURL + 'BNB.svg', 'native', bnbToUSD.data.usd));
        tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', providers_1.imagesURL + 'USDT.svg', 'custom', bnbToUSD.data.usd, bnbToUSD.data.usdt, providers_2.binanceUSDTContractAddress));
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenType) {
        const { data: bnbToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/BNB`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const fee = await this.web3.eth.estimateGas({
            from,
            to,
        });
        let value = await this.web3.eth.getGasPrice();
        value = tokenType == 'native' ? (+this.web3.utils.fromWei(value) * fee).toString() : (amount * 0.01).toString();
        const usd = Math.trunc(+value * Number(bnbToUSD.data.usd) * 100) / 100;
        return {
            value: Number(value),
            usd: usd,
        };
    }
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize, tokenType) {
        const { data: bnbToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/BNB`, {
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
            transactions.push(...resp.data.data.ethereum.transfers);
        }
        if (transactions.length === 0) {
            return { transactions: [], length: 0 };
        }
        transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(bnbToUSD.data.usd), Number(bnbToUSD.data.usdt)));
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
        if (tokenType != 'all') {
            if (tokenType == 'native') {
                transactions = transactions.filter((tx) => {
                    return tx.tokenName == "BNB";
                });
            }
            else {
                transactions = transactions.filter((tx) => {
                    return tx.tokenName == tokenType.toUpperCase();
                });
            }
        }
        const length = transactions.length;
        if (pageNumber || pageNumber === 0) {
            transactions = transactions.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        }
        return {
            transactions, length
        };
    }
    async sendMainToken(data) {
        const gasPrice = await this.web3.eth.getGasPrice();
        const gasCount = await this.web3.eth.estimateGas({
            value: this.web3.utils.toWei(data.amount.toString()),
        });
        const result = await this.web3.eth.sendTransaction({
            from: this.web3.eth.defaultAccount,
            to: data.receiverAddress,
            value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
            gasPrice: gasPrice,
            gas: gasCount,
        });
        return result.transactionHash;
    }
    async send20Token(data) {
        const tokenAddress = data.cotractAddress;
        const contract = new this.web3.eth.Contract(bnb_USDT_abi_1.bnbUSDTAbi, tokenAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(+(await contract.methods._decimals().call()));
        const amount = new bignumber_js_1.BigNumber(data.amount).multipliedBy(decimals).toNumber();
        const result = await contract.methods
            .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
            .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
        return result.transactionHash;
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    async getCustomTokenBalance(address, contractAddress) {
        const contract = new this.web3.eth.Contract(bnb_USDT_abi_1.bnbUSDTAbi, contractAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(Number(await contract.methods.decimals().call()));
        let balance = await contract.methods.balanceOf(address).call();
        balance = new bignumber_js_1.BigNumber(balance).dividedBy(decimals);
        return balance.toNumber();
    }
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, bnbToUSD, bnbToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(bnbToUSD) : Number(bnbToUSD);
        tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;
        const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
        const standard = tokenType === 'custom' ? 'BEP 20' : null;
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
      ethereum(network: bsc) {
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
        const amount = new bignumber_js_1.BigNumber(txData.amount).toFormat();
        let amountPriceInUSD = txData.currency.symbol === 'BNB' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * txData.amount * 100) / 100;
        const tokenLogo = providers_1.imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
        const to = txData.address.address;
        const from = txData.sender.address;
        const direction = from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN';
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
            fee: txData.fee,
            currencyFee: 'BNB',
            status: txData.success,
            tokenLogo,
        };
    }
}
exports.binanceService = binanceService;
//# sourceMappingURL=Binance.service.js.map