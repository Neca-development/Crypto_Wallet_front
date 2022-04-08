"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.harmonyService = void 0;
const providers_1 = require("../constants/providers");
const one_USDT_abi_1 = require("../constants/one-USDT.abi");
// @ts-ignore
const axios_1 = __importDefault(require("axios"));
const web3_1 = __importDefault(require("web3"));
// @ts-ignore
// import Wallet from "lumi-web-core";
const ethers_1 = require("ethers");
const numbers_1 = require("../utils/numbers");
const bignumber_js_1 = require("bignumber.js");
const bech32_converting_1 = __importDefault(require("bech32-converting"));
class harmonyService {
    constructor() {
        this.web3 = new web3_1.default(providers_1.harmonyProvider);
    }
    async generateKeyPair(mnemonic) {
        const wallet = ethers_1.ethers.Wallet.fromMnemonic(mnemonic);
        this.web3.eth.accounts.wallet.add(this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey));
        this.web3.eth.defaultAccount = wallet.address;
        const harmonyAddress = (0, bech32_converting_1.default)('one').toBech32(wallet.address);
        return {
            privateKey: wallet.privateKey,
            publicKey: harmonyAddress,
        };
    }
    async generatePublicKey(privateKey) {
        const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        const harmonyAddress = (0, bech32_converting_1.default)('one').toBech32(address);
        return harmonyAddress;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        // const { data: oneToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ONE`, {
        //   headers: {
        //     'auth-client-key': backendApiKey,
        //   },
        // });
        const oneToUSD = {
            data: {
                usd: '0.22',
                usdt: '1',
            },
        };
        const ethAddress = this.getEthAddress(address);
        const nativeTokensBalance = await this.web3.eth.getBalance(ethAddress);
        const USDTTokenBalance = await this.getCustomTokenBalance(ethAddress, providers_1.harmonyUSDTContractAddress);
        tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'ONE', providers_1.imagesURL + 'ONE.svg', 'native', oneToUSD.data.usd));
        tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', providers_1.imagesURL + 'USDT.svg', 'custom', oneToUSD.data.usd, oneToUSD.data.usdt, providers_1.harmonyUSDTContractAddress));
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenType) {
        // const { data: oneToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ONE`, {
        //   headers: {
        //     'auth-client-key': backendApiKey,
        //   },
        // });
        const oneToUSD = {
            data: {
                usd: '0.22',
            },
        };
        const gasPrice = await this.web3.eth.getGasPrice();
        const gasPriceInOne = this.web3.utils.fromWei(gasPrice);
        const gasLimit = tokenType == 'custom' ? 6721900 : 21000;
        const transactionFeeInOne = Math.trunc(+gasPriceInOne * gasLimit * 100) / 100;
        const usd = Math.trunc(transactionFeeInOne * Number(oneToUSD.data.usd) * 100) / 100;
        return {
            value: transactionFeeInOne,
            usd: usd,
        };
    }
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize, tokenType) {
        // const { data: oneToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ONE`, {
        //   headers: {
        //     'auth-client-key': backendApiKey,
        //   },
        // });
        const oneToUSD = {
            data: {
                usd: '0.22',
                usdt: '1',
            },
        };
        const ethAddress = this.getEthAddress(address);
        const result = await axios_1.default.post(providers_1.harmonyProvider, {
            jsonrpc: 2.0,
            method: 'hmyv2_getTransactionsHistory',
            params: [
                {
                    // address: '0x5b104aa1ddcc1cf5ff5d88869f46321cb139fd1d',
                    address: ethAddress,
                    pageIndex: 0,
                    pageSize: 1000,
                    fullTx: true,
                    txType: 'ALL',
                    order: 'ASC',
                },
            ],
            id: 1,
        });
        const history = result.data.result.transactions;
        // const queries = [];
        let transactions = [];
        // queries.push(this.generateTransactionsQuery(address, 'receiver'));
        // queries.push(this.generateTransactionsQuery(address, 'sender'));
        // for (const query of queries) {
        //   let { data: resp } = await axios.post(
        //     bitqueryProxy,
        //     {
        //       body: { query: query, variables: {} },
        //     },
        //     {
        //       headers: {
        //         'auth-client-key': backendApiKey,
        //       },
        //     }
        //   );
        //   transactions.push(...resp.data.data.ethereum.transfers);
        // }
        if (transactions.length === 0) {
            return { transactions: [], length: 0 };
        }
        transactions = history.map((el) => this.convertTransactionToCommonFormat(el, address, Number(oneToUSD.data.usd), Number(oneToUSD.data.usdt)));
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
                    return tx.tokenName == "ONE";
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
        const gasLimit = 6721900;
        const recieverEth = this.getEthAddress(data.receiverAddress);
        const transactionObject = {
            from: this.web3.eth.defaultAccount,
            to: recieverEth,
            value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())).toString(),
            gasPrice,
            gasLimit,
        };
        const result = await this.web3.eth.sendTransaction(transactionObject);
        return result.transactionHash;
    }
    async send20Token(data) {
        const tokenAddress = data.cotractAddress;
        const contract = new this.web3.eth.Contract(one_USDT_abi_1.oneUSDTAbi, tokenAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(+(await contract.methods.decimals().call()));
        const amount = new bignumber_js_1.BigNumber(data.amount).multipliedBy(decimals).toNumber();
        const recieverEth = this.getEthAddress(data.receiverAddress);
        const result = await contract.methods
            .transfer(recieverEth, this.web3.utils.toHex(amount))
            .send({ from: this.web3.eth.defaultAccount, gas: '3000000' }, function (err, res) {
            if (err) {
                throw new Error(err);
            }
        });
        return result.transactionHash;
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    async getCustomTokenBalance(address, contractAddress) {
        const contract = new this.web3.eth.Contract(one_USDT_abi_1.oneUSDTAbi, contractAddress);
        const decimals = (0, numbers_1.getBNFromDecimal)(Number(await contract.methods.decimals().call()));
        let balance = await contract.methods.balanceOf(address).call();
        balance = new bignumber_js_1.BigNumber(balance).dividedBy(decimals);
        return balance.toNumber();
    }
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, oneToUSD, oneToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(oneToCustomToken)) * Number(oneToUSD) : Number(oneToUSD);
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
        const amount = txData.value * 1e-18;
        // let amountPriceInUSD = txData.currency.symbol === 'ONE' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
        let amountPriceInUSD = tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * amount * 100) / 100;
        // const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
        const tokenLogo = providers_1.imagesURL + 'ONE.svg';
        const to = txData.to;
        const from = txData.from;
        // const fromHexFormat = converter('one').toHex(from)
        // const toHexFormat = converter('one').toHex(to)
        const direction = from === address.toLowerCase() ? 'OUT' : 'IN';
        return {
            to: to,
            from: from,
            amount: amount.toString(),
            amountInUSD: amountPriceInUSD.toString(),
            txId: txData.hash,
            direction,
            // type: txData.tokenType,
            tokenName: 'ONE',
            timestamp: +new Date(txData.timestamp * 1000),
            fee: txData.gas * +this.web3.utils.fromWei(txData.gasPrice.toString()),
            currencyFee: 'ONE',
            status: true,
            tokenLogo,
        };
    }
    getEthAddress(address) {
        if (address.substring(0, 3) === 'one') {
            return (0, bech32_converting_1.default)('one').toHex(address);
        }
        else {
            return address;
        }
    }
}
exports.harmonyService = harmonyService;
//# sourceMappingURL=Harmony.service.js.map