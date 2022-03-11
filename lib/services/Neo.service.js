"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.neoService = void 0;
const providers_1 = require("../constants/providers");
const providers_2 = require("../constants/providers");
const eth_USDT_abi_1 = require("../constants/eth-USDT.abi");
// @ts-ignore
const axios_1 = __importDefault(require("axios"));
const web3_1 = __importDefault(require("web3"));
const bip39_1 = require("bip39");
const neon_core_1 = require("@cityofzion/neon-core");
// @ts-ignore
const { default: Neon } = require('@cityofzion/neon-js');
const numbers_1 = require("../utils/numbers");
const bignumber_js_1 = require("bignumber.js");
class neoService {
    constructor() {
        this.web3 = new web3_1.default(providers_1.ethWeb3Provider);
    }
    async generateKeyPair(mnemonic) {
        const seed = (0, bip39_1.mnemonicToSeedSync)(mnemonic);
        const privateKey = neon_core_1.u.ab2hexstring(seed);
        const myWallet = Neon.create.wallet({ name: 'MyWallet' });
        myWallet.addAccount();
        console.log(myWallet);
        return {
            privateKey: 'wallet.privateKey',
            publicKey: 'wallet.address',
        };
    }
    async generatePublicKey(privateKey) {
        const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        return address;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        const { data: ethToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        const nativeTokensBalance = await this.web3.eth.getBalance(address);
        const USDTTokenBalance = await this.getCustomTokenBalance(address, providers_1.etherUSDTContractAddress);
        tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'ETH', providers_1.imagesURL + 'ETH.svg', 'native', ethToUSD.data.usd));
        tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', providers_1.imagesURL + 'USDT.svg', 'custom', ethToUSD.data.usd, ethToUSD.data.usdt, providers_1.etherUSDTContractAddress));
        return tokens;
    }
    async getFeePriceOracle(from, to) {
        const { data: ethToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        const transactionObject = {
            from,
            to,
        };
        const gasLimit = await this.web3.eth.estimateGas(transactionObject);
        let { data: price } = await axios_1.default.get(providers_1.etherGasPrice);
        const gasPriceGwei = price.fast / 10;
        const transactionFeeInEth = gasPriceGwei * 1e-9 * gasLimit;
        const usd = Math.trunc(transactionFeeInEth * Number(ethToUSD.data.usd) * 100) / 100;
        return {
            value: transactionFeeInEth,
            usd: usd,
        };
    }
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize) {
        const { data: ethToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
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
                    'auth-client-key': providers_2.backendApiKey,
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
        const length = transactions.length;
        if (pageNumber || pageNumber === 0) {
            transactions = transactions.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        }
        return {
            transactions, length
        };
    }
    async sendMainToken(data) {
        const fee = await this.getFeePriceOracle(this.web3.defaultAccount, data.receiverAddress);
        const result = await this.web3.eth.sendTransaction({
            from: this.web3.eth.defaultAccount,
            to: data.receiverAddress,
            value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())).toString(),
            gas: Math.trunc(Number(fee.value) * 1e9),
        });
        return result.transactionHash;
    }
    async send20Token(data) {
        const tokenAddress = data.cotractAddress;
        const contract = new this.web3.eth.Contract(eth_USDT_abi_1.etherUSDTAbi, tokenAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(+(await contract.methods.decimals().call()));
        const amount = new bignumber_js_1.BigNumber(data.amount).multipliedBy(decimals).toNumber();
        const result = await contract.methods
            .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
            .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
        console.log(result);
        return result.transactionHash;
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    async getCustomTokenBalance(address, contractAddress) {
        const contract = new this.web3.eth.Contract(eth_USDT_abi_1.etherUSDTAbi, contractAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(Number(await contract.methods.decimals().call()));
        let balance = await contract.methods.balanceOf(address).call();
        balance = new bignumber_js_1.BigNumber(balance).dividedBy(decimals);
        return balance.toNumber();
    }
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, ethToUSD, ethToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(ethToCustomToken)) * Number(ethToUSD) : Number(ethToUSD);
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
      ethereum(network: ethereum) {
        transfers(
              options: {desc: "any", limit: 1000}
              amount: {gt: 0}
              ${direction}: {is: "0x9FaBf26C357bFd8A2a6fFE965EC1F72A55033DD0"}
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
        let amountPriceInUSD = txData.currency.symbol === 'ETH' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * txData.amount * 100) / 100;
        const tokenLogo = providers_1.imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
        const to = txData.address.address;
        const from = txData.sender.address;
        const direction = from === address.toLowerCase() ? 'OUT' : 'IN';
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
            currencyFee: 'NEO',
            status: txData.success,
            tokenLogo,
        };
    }
}
exports.neoService = neoService;
//# sourceMappingURL=Neo.service.js.map