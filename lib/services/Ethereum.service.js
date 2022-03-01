import { ethWeb3Provider, etherUSDTContractAddress, etherGasPrice, backendApi, imagesURL, bitqueryProxy, } from '../constants/providers';
import { backendApiKey } from './../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';
// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ethers } from 'ethers';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
export class ethereumService {
    constructor() {
        this.web3 = new Web3(ethWeb3Provider);
    }
    async generateKeyPair(mnemonic) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
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
        const { data: ethToUSD } = await axios.get(`${backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': backendApiKey,
            },
        });
        const nativeTokensBalance = await this.web3.eth.getBalance(address);
        const USDTTokenBalance = await this.getCustomTokenBalance(address, etherUSDTContractAddress);
        tokens.push(this.generateTokenObject(Number(this.web3.utils.fromWei(nativeTokensBalance)), 'ETH', imagesURL + 'ETH.svg', 'native', ethToUSD.data.usd));
        tokens.push(this.generateTokenObject(USDTTokenBalance, 'Tether USDT', imagesURL + 'USDT.svg', 'custom', ethToUSD.data.usd, ethToUSD.data.usdt, etherUSDTContractAddress));
        return tokens;
    }
    async getFeePriceOracle(from, to, amount, tokenTypes, speed) {
        const { data: ethToUSD } = await axios.get(`${backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': backendApiKey,
            },
        });
        const transactionObject = {
            from,
            to,
        };
        const gasLimit = tokenTypes == 'custom' ? 200000 : await this.web3.eth.estimateGas(transactionObject);
        let { data: price } = await axios.get(etherGasPrice);
        let gasPriceGwei;
        switch (speed) {
            case 'slow':
                gasPriceGwei = price.average / 10;
                break;
            case 'medium':
                gasPriceGwei = price.fast / 10;
                break;
            case 'fast':
                gasPriceGwei = price.fastest / 10;
                break;
            default:
                break;
        }
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
    async getTransactionsHistoryByAddress(address) {
        const { data: ethToUSD } = await axios.get(`${backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': backendApiKey,
            },
        });
        const queries = [];
        let transactions = [];
        queries.push(this.generateTransactionsQuery(address, 'receiver'));
        queries.push(this.generateTransactionsQuery(address, 'sender'));
        for (const query of queries) {
            let { data: resp } = await axios.post(bitqueryProxy, {
                body: { query: query, variables: {} },
            }, {
                headers: {
                    'auth-client-key': backendApiKey,
                },
            });
            transactions.push(...resp.data.data.ethereum.transfers);
        }
        if (transactions.length === 0) {
            return [];
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
        return transactions;
    }
    async sendMainToken(data) {
        const fee = await this.getFeePriceOracle(this.web3.defaultAccount, data.receiverAddress, data.amount, 'native', data.speed);
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
        const contract = new this.web3.eth.Contract(etherUSDTAbi, tokenAddress);
        const decimals = getBNFromDecimal(+(await contract.methods.decimals().call()));
        const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
        const result = await contract.methods
            .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
            .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
        return result.transactionHash;
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    async getCustomTokenBalance(address, contractAddress) {
        const contract = new this.web3.eth.Contract(etherUSDTAbi, contractAddress);
        const decimals = getBNFromDecimal(Number(await contract.methods.decimals().call()));
        let balance = await contract.methods.balanceOf(address).call();
        balance = new BigNumber(balance).dividedBy(decimals);
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
//# sourceMappingURL=Ethereum.service.js.map