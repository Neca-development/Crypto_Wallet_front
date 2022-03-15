"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polygonService = void 0;
const numbers_1 = require("../utils/numbers");
const providers_1 = require("../constants/providers");
const providers_2 = require("../constants/providers");
const matic_USDT_abi_1 = require("../constants/matic-USDT.abi");
// @ts-ignore
const axios_1 = __importDefault(require("axios"));
const web3_1 = __importDefault(require("web3"));
const ethers_1 = require("ethers");
const bignumber_js_1 = require("bignumber.js");
class polygonService {
    constructor() {
        this.web3 = new web3_1.default(providers_2.polygonWeb3Provider);
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
        const { data: maticToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/MATIC`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const nativeTokensBalance = await this.web3.eth.getBalance(address);
        const USDTTokenBalance = await this.getCustomTokenBalance(address, providers_2.polygonUSDTContractAddress);
        tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'MATIC', providers_1.imagesURL + 'MATIC.svg', 'native', maticToUSD.data.usd));
        tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', providers_1.imagesURL + 'USDT.svg', 'custom', maticToUSD.data.usd, maticToUSD.data.usdt, providers_2.polygonUSDTContractAddress));
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenType) {
        const { data: maticToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/MATIC`, {
            headers: {
                'auth-client-key': providers_1.backendApiKey,
            },
        });
        const estimatedGas = tokenType == 'native'
            ? await this.web3.eth.estimateGas({
                from,
                to,
            })
            : 100000;
        const { data: gasPrice } = await axios_1.default.get(providers_1.polygonGasPrice);
        const transactionFee = (estimatedGas * gasPrice.standard) / 1000000000;
        const usd = Math.trunc(transactionFee * Number(maticToUSD.data.usd) * 100) / 100;
        return {
            value: transactionFee,
            usd: usd,
        };
    }
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize) {
        const { data: maticToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/MATIC`, {
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
        const length = transactions.length;
        if (pageNumber || pageNumber === 0) {
            transactions = transactions.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        }
        return {
            transactions, length
        };
    }
    async sendMainToken(data) {
        const { data: gasPrice } = await axios_1.default.get(providers_1.polygonGasPrice);
        const gasCount = await this.web3.eth.estimateGas({
            value: this.web3.utils.toWei(data.amount.toString()),
        });
        const result = await this.web3.eth.sendTransaction({
            from: this.web3.eth.defaultAccount,
            to: data.receiverAddress,
            value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
            gasPrice: gasPrice.standard * 1000000000,
            gas: gasCount,
        });
        return result.transactionHash;
    }
    async send20Token(data) {
        const tokenAddress = data.cotractAddress;
        const contract = new this.web3.eth.Contract(matic_USDT_abi_1.maticUSDTAbi, tokenAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(+(await contract.methods.decimals().call()));
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
        const contract = new this.web3.eth.Contract(matic_USDT_abi_1.maticUSDTAbi, contractAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(Number(await contract.methods.decimals().call()));
        let balance = await contract.methods.balanceOf(address).call();
        balance = new bignumber_js_1.BigNumber(balance).dividedBy(decimals);
        return balance.toNumber();
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
        const amount = new bignumber_js_1.BigNumber(txData.amount).toFormat();
        let amountPriceInUSD = txData.currency.symbol === 'MATIC' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * txData.amount * 100) / 100;
        const tokenLogo = providers_1.imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
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
            currencyFee: 'MATIC',
            status: txData.success,
            tokenLogo,
        };
    }
}
exports.polygonService = polygonService;
//# sourceMappingURL=Polygon.service.js.map