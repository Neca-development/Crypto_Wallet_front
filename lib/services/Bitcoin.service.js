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
// @ts-ignore
import bitcore from 'bitcore-explorers/node_modules/bitcore-lib';
export class bitcoinService {
    constructor() {
        this.web3 = new Web3(binanceWeb3Provider);
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            // this.lumiWallet = new Wallet();
            const addrFromMnemonic = new Mnemonic(mnemonic);
            const privateKey = addrFromMnemonic.toHDPrivateKey().privateKey.toString();
            const publicKey = addrFromMnemonic.toHDPrivateKey().privateKey.toAddress('testnet').toString();
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
            let { data: utxos } = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${address}`);
            utxos = utxos.data.txs;
            const nativeTokensBalance = utxos.reduce((accum, elem) => (accum += Number(elem.value)), 0);
            tokens.push(this.generateTokenObject(nativeTokensBalance, 'BTC', imagesURL + 'BTC.svg', 'native', btcToUSD.data.usd));
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
            const sochain_network = 'BTCTEST';
            const privateKey = '';
            const sourceAddress = 'data.address';
            const satoshiToSend = data.amount * 100000000;
            let fee = 0;
            let inputCount = 0;
            let outputCount = 2;
            const utxos = yield axios.get(`https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`);
            const transaction = new bitcore.Transaction();
            let totalAmountAvailable = 0;
            let inputs = [];
            utxos.data.data.txs.forEach((element) => __awaiter(this, void 0, void 0, function* () {
                let utxo = {};
                utxo.satoshis = Math.floor(Number(element.value) * 100000000);
                utxo.script = element.script_hex;
                utxo.address = utxos.data.data.address;
                utxo.txId = element.txid;
                utxo.outputIndex = element.output_no;
                totalAmountAvailable += utxo.satoshis;
                inputCount += 1;
                inputs.push(utxo);
            }));
            let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
            // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte
            fee = transactionSize * 20;
            if (totalAmountAvailable - satoshiToSend - fee < 0) {
                throw new Error('Balance is too low for this transaction');
            }
            //Set transaction input
            transaction.from(inputs);
            // set the recieving address and the amount to send
            transaction.to(data.receiverAddress, satoshiToSend);
            // Set change address - Address to receive the left over funds after transfer
            transaction.change(sourceAddress);
            //manually set transaction fees: 20 satoshis per byte
            transaction.fee(fee * 20);
            // Sign transaction with your private key
            transaction.sign(privateKey);
            // serialize Transactions
            const serializedTransaction = transaction.serialize();
            // Send transaction
            const result = yield axios({
                method: 'POST',
                url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
                data: {
                    tx_hex: serializedTransaction,
                },
            });
            return result.data.data;
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