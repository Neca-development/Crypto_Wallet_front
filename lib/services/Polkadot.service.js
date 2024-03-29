"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polkadotService = void 0;
const providers_1 = require("../constants/providers");
const providers_2 = require("../constants/providers");
const eth_USDT_abi_1 = require("../constants/eth-USDT.abi");
// @ts-ignore
const axios_1 = __importDefault(require("axios"));
const numbers_1 = require("../utils/numbers");
const bignumber_js_1 = require("bignumber.js");
const keyring_1 = require("@polkadot/keyring");
const api_1 = require("@polkadot/api");
const errors_1 = require("../errors");
const enums_1 = require("../models/enums");
class polkadotService {
    constructor() {
        this._provider = new api_1.WsProvider('wss://rpc.polkadot.io');
    }
    async generateKeyPair(mnemonic) {
        this._api = await api_1.ApiPromise.create({ provider: this._provider });
        this._keyring = new keyring_1.Keyring({ type: 'sr25519', ss58Format: 0 });
        this._keypair = this._keyring.addFromUri(mnemonic);
        this._publicKey = this._keypair.address;
        return {
            publicKey: this._publicKey,
            privateKey: null,
        };
    }
    async generatePublicKey(privateKey) {
        this._api = await api_1.ApiPromise.create({ provider: this._provider });
        this._keyring = new keyring_1.Keyring({ type: 'ed25519', ss58Format: 0 });
        this._publicKey = this._keyring.addFromUri(privateKey).address;
        const address = this._publicKey;
        return address;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        const { data: dotToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/DOT`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        const { data: { free: nativeTokensBalance }, } = await this._api.query.system.account(this._publicKey);
        // const USDTTokenBalance = await this.getCustomTokenBalance(address, etherUSDTContractAddress);
        tokens.push(this.generateTokenObject(Math.trunc(nativeTokensBalance * 10e-11 * 100) / 100, 'DOT', providers_1.imagesURL + 'DOT.svg', 'native', dotToUSD.data.usd));
        // tokens.push(
        //   this.generateTokenObject(
        //     USDTTokenBalance,
        //     'Tether USDT',
        //     imagesURL + 'USDT.svg',
        //     'custom',
        //     dotToUSD.data.usd,
        //     dotToUSD.data.usdt,
        //     etherUSDTContractAddress
        //   )
        // );
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenTypes) {
        const { data: dotToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/DOT`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        // const adres = '0x02b33c917f2f6103448d7feb42614037d05928433cb25e78f01a825aa829bb3c27';
        // const {data} = await axios.get(`https://api.snowtrace.io/api?module=account&action=txlist&address=${adres}&startblock=1&endblock=99999999&sort=asc&apikey=YourApiKeyToken`)
        this._tx = this._api.tx.balances.transfer(to, +amount * 10e11);
        const { partialFee: fee } = await this._tx.paymentInfo(from);
        const transactionFeeInDot = tokenTypes == 'native' ? Math.trunc(10e-11 * fee.toJSON() * 100) / 100 : null;
        const usd = Math.trunc(transactionFeeInDot * Number(dotToUSD.data.usd) * 100) / 100;
        return {
            value: transactionFeeInDot,
            usd,
        };
    }
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    async getTransactionsHistoryByAddress(address, pageNumber, pageSize) {
        const { data: ethToUSD } = await axios_1.default.get(`${providers_1.backendApi}coins/DOT`, {
            headers: {
                'auth-client-key': providers_2.backendApiKey,
            },
        });
        const { data: { data: data }, } = await axios_1.default.get(`${providers_1.blockChairAPI}${address}`);
        // const queries = [];
        let transactions = [];
        // queries.push(this.generateTransactionsQuery(address, 'receiver'));
        // queries.push(this.generateTransactionsQuery(address, 'sender'));
        //
        // for (const query of queries) {
        //   let { data: resp } = await axios.post(
        //     bitqueryProxy,
        //     {
        //       body: { query: query, variables: {} }
        //     },
        //     {
        //       headers: {
        //         'auth-client-key': backendApiKey
        //       }
        //     }
        //   );
        // console.log(resp) }
        transactions.push(...data[Object.keys(data)[0]].transfers);
        transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), Number(ethToUSD.data.usdt), 'dot', 'TransferContract'));
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
            transactions,
            length,
        };
    }
    async sendMainToken(data) {
        const transactionHash = await this._api.tx.balances
            .transfer(data.receiverAddress, data.amount * 10e9)
            .signAndSend(this._keypair, (result) => {
            if (result.status.isFinalized) {
                transactionHash();
            }
        });
        return transactionHash;
    }
    async send20Token(data) {
        // const tokenAddress = data.cotractAddress;
        // const contract = new this.web3.eth.Contract(etherUSDTAbi as any, tokenAddress);
        // const decimals = getBNFromDecimal(+(await contract.methods.decimals().call()));
        // const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
        // const result = await contract.methods
        //   .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
        //   .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
        // console.log(result);
        throw new errors_1.CustomError('Network doesnt support this method', 14, enums_1.ErrorsTypes['Unknown error']);
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
      polkadot(network: polkadot) {
        transfers(
              options: {desc: "any", limit: 1000}
              amount: {gt: 0}
              ${direction}: {is: "0x7083609fce4d1d8dc0c979aab8c869ea2c873402"}
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
    convertTransactionToCommonFormat(txData, address, tokenPriceToUSD, nativeTokenToUSD, symbol, tokenType) {
        const amount = Math.trunc(txData.amount * 10e-9) / 100;
        let amountPriceInUSD = tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * amount * 100) / 100;
        const tokenLogo = providers_1.imagesURL + symbol.toUpperCase() + '.svg';
        const to = txData.recipient;
        const from = txData.sender;
        const direction = from === address.toLowerCase() ? 'OUT' : 'IN';
        return {
            to,
            from,
            amount: amount.toString(),
            amountInUSD: amountPriceInUSD.toString(),
            txId: txData.hash,
            direction,
            type: txData.event_id === 'Transfer' ? 'TransferContract' : 'TriggerSmartContract',
            tokenName: symbol,
            timestamp: new Date(txData.block_timestamp).getTime(),
            fee: txData.fee,
            currencyFee: 'DOT',
            status: !txData.failed,
            tokenLogo,
        };
    }
}
exports.polkadotService = polkadotService;
//# sourceMappingURL=Polkadot.service.js.map