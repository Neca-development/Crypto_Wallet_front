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
import { backendApiKey } from '../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';
// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { mnemonicToSeedSync } from 'bip39';
import { u } from '@cityofzion/neon-core';
// @ts-ignore
const { default: Neon, api, core } = require('@cityofzion/neon-js');
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
const apiPlugin = require('@cityofzion/neon-api');
import { rpc } from '@cityofzion/neon-core';
export class neoService {
    constructor() {
        this.network = 'MainNet';
        console.log({ api, Neon });
        console.log(Neon.create.rpcClient('http://seed1.neo.org:10332'));
        this.web3 = new Web3(ethWeb3Provider);
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const seed = Array.from(mnemonicToSeedSync(mnemonic).slice(0, 32));
            const privateKey = u.ab2hexstring(seed);
            this.neoWallet = Neon.create.wallet();
            this.neoWallet.addAccount(privateKey);
            const account = this.neoWallet.accounts[0];
            console.log(account.WIF);
            // console.log(this.neoWallet);
            return {
                privateKey: account.WIF,
                publicKey: account.address,
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
            const nodes = [
                { url: 'https://mainnet1.neo.coz.io:443' },
                { url: 'https://mainnet2.neo.coz.io:443' },
                { url: 'https://mainnet3.neo.coz.io:443' },
                { url: 'https://mainnet4.neo.coz.io:443' },
                { url: 'https://mainnet5.neo.coz.io:443' },
                { url: 'http://seed1.neo.org:10332' },
                { url: 'http://seed2.neo.org:10332' },
                { url: 'http://seed3.neo.org:10332' },
                { url: 'http://seed4.neo.org:10332' },
                { url: 'http://seed5.neo.org:10332' },
            ];
            const rpcClient = new rpc.RPCClient('https://mainnet1.neo.coz.io:443');
            console.log('%cMyProject%cline:83%crpcClient', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(38, 157, 128);padding:3px;border-radius:2px', rpcClient);
            const balance = 3;
            const balances = {
                NEO: 0,
                GAS: 0,
            };
            const convertToArbitraryDecimals = (num, decimals = 8) => {
                // eslint-disable-next-line
                const multiplier = 1 / Math.pow(10, decimals);
                return (num * multiplier).toFixed(decimals);
            };
            try {
                const balanceResponse = yield rpcClient.execute(new rpc.Query({
                    method: 'getnep17balances',
                    params: [address],
                }));
                console.log('%cMyProject%cline:106%cbalanceResponse', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(217, 104, 49);padding:3px;border-radius:2px', balanceResponse);
                //@ts-ignore
                const { result } = balanceResponse;
                for (const balance of result.balance) {
                    const { assethash, amount } = balance;
                    const tokenNameResponse = yield new rpc.RPCClient(nodes[0].url).invokeFunction(assethash, 'symbol').catch((e) => {
                        console.error({ e });
                    });
                    // @ts-ignore
                    const symbol = atob(tokenNameResponse.stack[0].value);
                    const decimalResponse = yield new rpc.RPCClient(nodes[0].url).invokeFunction(assethash, 'decimals').catch((e) => {
                        console.error({ e });
                    });
                    // @ts-ignore
                    const decimals = decimalResponse.stack[0].value;
                    const parsedAmount = convertToArbitraryDecimals(amount, decimals);
                    if (symbol === 'NEO' || symbol === 'GAS') {
                        balances[symbol] = Number(parsedAmount);
                    }
                    else {
                        balances[assethash] = {
                            symbol,
                            cryptocompareSymbol: undefined,
                            scriptHash: assethash,
                            decimals,
                            balance: parsedAmount,
                        };
                    }
                }
                console.log(balances);
            }
            catch (e) {
                console.log(e);
            }
            const tokens = [];
            const { data: neoToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            tokens.push(this.generateTokenObject(balance, 'NEO', imagesURL + 'NEO.svg', 'native', neoToUSD.data.usd, neoToUSD.data.usdt, etherUSDTContractAddress));
            return tokens;
        });
    }
    getFeePriceOracle(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: neoToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const transactionObject = {
                from,
                to,
            };
            const gasLimit = yield this.web3.eth.estimateGas(transactionObject);
            let { data: price } = yield axios.get(etherGasPrice);
            const gasPriceGwei = price.fast / 10;
            const transactionFeeInEth = gasPriceGwei * 1e-9 * gasLimit;
            const usd = Math.trunc(transactionFeeInEth * Number(neoToUSD.data.usd) * 100) / 100;
            return {
                value: transactionFeeInEth,
                usd: usd,
            };
        });
    }
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: neoToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
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
            transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(neoToUSD.data.usd), Number(neoToUSD.data.usdt)));
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
            const fee = yield this.getFeePriceOracle(this.web3.defaultAccount, data.receiverAddress);
            const result = yield this.web3.eth.sendTransaction({
                from: this.web3.eth.defaultAccount,
                to: data.receiverAddress,
                value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())).toString(),
                gas: Math.trunc(Number(fee.value) * 1e9),
            });
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
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, neoToUSD, ethToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(ethToCustomToken)) * Number(neoToUSD) : Number(neoToUSD);
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
            txId: txData.transaction.hash,
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
//# sourceMappingURL=Neo.service.js.map