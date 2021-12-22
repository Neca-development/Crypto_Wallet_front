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
import { imagesURL, backendApi, backendApiKey, bitqueryProxy } from '../constants/providers';
import { binanceWeb3Provider } from '../constants/providers';
import { bnbUSDTAbi } from '../constants/bnb-USDT.abi';
// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { BigNumber } from 'bignumber.js';
// @ts-ignore
const bitcore = require('bitcore-lib');
// @ts-ignore
const Mnemonic = require('bitcore-mnemonic');
import * as bitcoin from 'bitcoinjs-lib';
export class bitcoinService {
    constructor() {
        this.web3 = new Web3(binanceWeb3Provider);
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(bitcoin);
            const addrFromMnemonic = new Mnemonic(mnemonic);
            const privateKey = addrFromMnemonic.toHDPrivateKey().privateKey.toString();
            const publicKey = addrFromMnemonic.toHDPrivateKey().privateKey.toAddress('testnet').toString();
            // const privateKey = 'cUs6kyTUjN9EZBNYiSuCBNP3iD7fxr2vZpPuWzQz8eUgVoLB1vP6';
            // const publicKey = 'tb1qnpwavl7uezu8x5qqptd7vjd2s9fvy3r48w4qjt';
            // var yourAddresskeyPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
            console.log(addrFromMnemonic.toHDPrivateKey().privateKey.toWIF());
            this.keys = {
                privateKey,
                publicKey,
            };
            return this.keys;
        });
    }
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKey = bitcore.PrivateKey(privateKey).toAddress('testnet').toString();
            this.keys = {
                privateKey,
                publicKey,
            };
            return publicKey;
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            let btcToUSD;
            try {
                btcToUSD = (yield axios.get(`${backendApi}coins/BTC`, {
                    headers: {
                        'auth-client-key': backendApiKey,
                    },
                })).data;
            }
            catch (error) {
                console.log('server was dropped');
            }
            const sochain_network = 'BTCTEST';
            let { data: balance } = yield axios.get(`https://sochain.com/api/v2/get_address_balance/${sochain_network}/${address}`);
            balance = balance.data.confirmed_balance;
            const nativeTokensBalance = balance;
            tokens.push(this.generateTokenObject(nativeTokensBalance, 'BTC', imagesURL + 'BTC.svg', 'native', btcToUSD.data.usd));
            return tokens;
        });
    }
    getFeePriceOracle(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log({ from, to });
            return {
                value: '12324',
                usd: '2',
            };
        });
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: btcToUSD } = yield axios.get(`${backendApi}coins/BNB`, {
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
            transactions = transactions.map((el) => this.convertTransactionToCommonFormat(el, address, Number(btcToUSD.data.usd), Number(btcToUSD.data.usdt)));
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
            const sochain_network = 'BTCTEST', privateKey = data.privateKey, sourceAddress = this.keys.publicKey, utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`), transaction = new bitcoin.TransactionBuilder(bitcoin.networks.testnet), amount = Math.trunc(data.amount * 1e8);
            let totalInputsBalance = 0, fee = 0, inputCount = 1, outputCount = 2;
            transaction.setVersion(1);
            utxos.data.data.txs.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                fee = (inputCount * 146 + outputCount * 33 + 10) * 20;
                if (totalInputsBalance - amount - fee > 0) {
                    return;
                }
                transaction.addInput(element.txid, element.output_no);
                inputCount + 1;
                totalInputsBalance += Math.floor(Number(element.value) * 100000000);
            }));
            transaction.addOutput(data.receiverAddress, amount);
            if (totalInputsBalance - amount - fee < 0) {
                throw new Error('Balance is too low for this transaction');
            }
            const privateKeyECpair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), { network: bitcoin.networks.testnet });
            transaction.sign(0, privateKeyECpair);
            console.log(transaction.buildIncomplete().toHex());
            const { data: trRequest } = yield axios.post(`${backendApi}transactions/so-chain/${sochain_network}`, {
                tx_hex: transaction.buildIncomplete().toHex(),
            }, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            return trRequest.data.txid;
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
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, btcToUSD, bnbToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(btcToUSD) : Number(btcToUSD);
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
        return `
      query{
      ethereum(network: bsc_testnet) {
        transfers(
              options: {desc: "any", limit: 1000}
              amount: {gt: 0}
              ${direction}: {is: "${address}"}
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
        let amountPriceInUSD = txData.currency.symbol === 'BNB' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * txData.amount * 100) / 100;
        const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
        const to = txData.address.address;
        const from = txData.sender.address;
        const direction = from.toLowerCase() === address.toLowerCase() ? 'OUT' : 'IN';
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
//# sourceMappingURL=Bitcoin.service.js.map