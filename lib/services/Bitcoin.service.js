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
import Mnemonic from 'bitcore-mnemonic';
export class bitcoinService {
    constructor() {
        this.web3 = new Web3(binanceWeb3Provider);
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            // this.lumiWallet = new Wallet();
            const addrFromMnemonic = new Mnemonic(mnemonic);
            console.log('%cMyProject%cline:40%caddrFromMnemonic', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(114, 83, 52);padding:3px;border-radius:2px', addrFromMnemonic.toHDPrivateKey());
            const utxo = yield axios.get('https://blockchain.info/unspent?active=' +
                addrFromMnemonic.toHDPrivateKey().privateKey.toAddress('testnet').toString());
            console.log('%cMyProject%cline:52%cutxo', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(118, 77, 57);padding:3px;border-radius:2px', utxo);
            // const address = new bitcore.PrivateKe();
            // await this.lumiWallet.createByMnemonic(mnemonic);
            // const data = {
            //   path: "m/44'/0'/0'/0",
            //   from: 0,
            //   to: 0,
            //   coins: [{ coin: 'BTC', type: 'p2pkh' }],
            // };
            // const coins = await this.lumiWallet.getChildNodes(data);
            // return {
            //   privateKey: coins.list[0].privateKey,
            //   publicKey: coins.list[0].p2pkhAddress,
            // };
            return {
                privateKey: addrFromMnemonic.toHDPrivateKey().privateKey.toString(),
                publicKey: addrFromMnemonic.toHDPrivateKey().privateKey.toAddress('testnet').toString(),
            };
        });
    }
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.lumiWallet.createByKey(privateKey);
            const data = {
                path: "m/44'/0'/0'/0",
                from: 0,
                to: 0,
                coins: [{ coin: 'BTC', type: 'p2pkh' }],
            };
            const coins = yield this.lumiWallet.getChildNodes(data);
            // testnet address
            // publicKey = publicKey.replace('bc', 'tb');
            return coins.list[0].p2pkhAddress;
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            const { data: btcToUSD } = yield axios.get(`${backendApi}coins/BNB`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const nativeTokensBalance = yield this.web3.eth.getBalance(address);
            tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'BNB', imagesURL + 'BNB.svg', 'native', btcToUSD.data.usd));
            return tokens;
        });
    }
    getFeePriceOracle(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: btcToUSD } = yield axios.get(`${backendApi}coins/BNB`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const fee = yield this.web3.eth.estimateGas({
                from,
                to,
            });
            let value = yield this.web3.eth.getGasPrice();
            value = (+this.web3.utils.fromWei(value) * fee).toString();
            const usd = Math.trunc(+value * Number(btcToUSD.data.usd) * 100) / 100;
            return {
                value,
                usd: usd.toString(),
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
            const gasPrice = yield this.web3.eth.getGasPrice();
            const gasCount = yield this.web3.eth.estimateGas({
                value: this.web3.utils.toWei(data.amount.toString()),
            });
            const result = yield this.web3.eth.sendTransaction({
                from: this.web3.eth.defaultAccount,
                to: data.receiverAddress,
                value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
                gasPrice: gasPrice,
                gas: gasCount,
            });
            return result.transactionHash;
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