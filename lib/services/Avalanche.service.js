var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ethWeb3Provider, backendApi, imagesURL } from '../constants/providers';
import { backendApiKey } from '../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';
// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { TestnetConfig } from '@avalabs/avalanche-wallet-sdk';
import { Avalanche, BN, HDNode, Mnemonic, utils } from 'avalanche';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
export class avalancheService {
    constructor() {
        this.networkConfog = TestnetConfig;
        this.avaxAssetId = utils.Defaults.network[this.networkConfog.networkID].X['avaxAssetID'];
        this.web3 = new Web3(ethWeb3Provider);
        const { apiIp: ip, apiPort: port, apiProtocol: protocol, networkID } = this.networkConfog;
        const avalanche = new Avalanche(ip, port, protocol, networkID);
        this.xchain = avalanche.XChain();
    }
    generateKeyPair(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const mnemonicInst = Mnemonic.getInstance();
            const xKeychain = this.xchain.keyChain();
            const seed = mnemonicInst.mnemonicToSeedSync(mnemonic);
            const hdnode = new HDNode(seed);
            const child = hdnode.derive(`m/44'/9000'/0'/0/0`);
            xKeychain.importKey(child.privateKeyCB58);
            const keys = xKeychain.getKey(xKeychain.getAddresses()[0]);
            const publicKey = keys.getAddressString();
            const privateKey = keys.getPrivateKeyString();
            this.keys = {
                privateKey,
                publicKey,
            };
            return this.keys;
        });
    }
    generatePublicKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const xKeychain = this.xchain.keyChain();
            xKeychain.importKey(privateKey);
            const keys = xKeychain.getKey(xKeychain.getAddresses()[0]);
            const publicKey = keys.getAddressString();
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
            const { data: ethToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const AVAX = yield this.xchain.getBalance(address, 'AVAX');
            const nativeTokensBalance = AVAX.balance / 1e9;
            tokens.push(this.generateTokenObject(nativeTokensBalance, 'AVAX', imagesURL + 'AVAX.svg', 'native', ethToUSD.data.usd));
            return tokens;
        });
    }
    getFeePriceOracle(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: ethToUSD } = yield axios.get(`${backendApi}coins/ETH`, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            const value = this.xchain.getDefaultTxFee().toNumber() / 1e9;
            const usd = Math.trunc(value * Number(ethToUSD.data.usd) * 100) / 100;
            return {
                value,
                usd,
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
            console.log(ethToUSD);
            console.log(yield this.xchain.getAddressTxs(address, null, null, this.avaxAssetId));
            let transactions = [];
            console.log('%cMyProject%cline:123%ctransactions', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(60, 79, 57);padding:3px;border-radius:2px', transactions);
            // if (transactions.txIDs.length === 0) {
            //   return [];
            // }
            // transactions = transactions.map((el: any) =>
            //   this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), Number(ethToUSD.data.usdt))
            // );
            // transactions.sort((a, b) => {
            //   if (a.timestamp > b.timestamp) {
            //     return -1;
            //   } else if (a.timestamp < b.timestamp) {
            //     return 1;
            //   } else {
            //     return 0;
            //   }
            // });
            // return transactions;
            return [];
        });
    }
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = this.keys.publicKey;
            let { utxos } = yield this.xchain.getUTXOs(address);
            let sendAmount = new BN(data.amount * 1e9); //amounts are in BN format
            let unsignedTx = yield this.xchain.buildBaseTx(utxos, sendAmount, this.avaxAssetId, [data.receiverAddress], [address], [address]);
            let signedTx = unsignedTx.sign(this.xchain.keyChain());
            let txid = yield this.xchain.issueTx(signedTx);
            return txid;
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
        const amount = new BigNumber(txData.amount).toFormat();
        let amountPriceInUSD = txData.currency.symbol === 'AVAX' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
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
//# sourceMappingURL=Avalanche.service.js.map