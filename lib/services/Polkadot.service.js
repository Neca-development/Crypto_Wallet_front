import { backendApi, imagesURL, blockChairAPI } from '../constants/providers';
import { backendApiKey } from '../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';
// @ts-ignore
import axios from 'axios';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
import { Keyring } from '@polkadot/keyring';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { CustomError } from '../errors';
import { ErrorsTypes } from '../models/enums';
export class polkadotService {
    constructor() {
        this._provider = new WsProvider('wss://rpc.polkadot.io');
    }
    async generateKeyPair(mnemonic) {
        this._api = await ApiPromise.create({ provider: this._provider });
        this._keyring = new Keyring({ type: 'ed25519', ss58Format: 0 });
        const pair = this._keyring.addFromUri(mnemonic);
        this._publicKey = pair.address;
        const registry = await this._api.query;
        this._api.tx.balances.setBalance(this._publicKey, 20, 8);
        return {
            publicKey: this._publicKey, privateKey: null
        };
    }
    async generatePublicKey(privateKey) {
        this._api = await ApiPromise.create({ provider: this._provider });
        this._keyring = new Keyring({ type: 'ed25519', ss58Format: 0 });
        this._publicKey = this._keyring.addFromUri(privateKey).address;
        const address = this._publicKey;
        return address;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        const { data: dotToUSD } = await axios.get(`${backendApi}coins/DOT`, {
            headers: {
                'auth-client-key': backendApiKey
            }
        });
        const { data: { free: nativeTokensBalance } } = await this._api.query.system.account(this._publicKey);
        // const USDTTokenBalance = await this.getCustomTokenBalance(address, etherUSDTContractAddress);
        tokens.push(this.generateTokenObject(Number(nativeTokensBalance * 10e-10), 'DOT', imagesURL + 'DOT.svg', 'native', dotToUSD.data.usd));
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
    async getFeePriceOracle(from, to) {
        const { data: dotToUSD } = await axios.get(`${backendApi}coins/DOT`, {
            headers: {
                'auth-client-key': backendApiKey
            }
        });
        const balanceFrom = await this._api.derive.balances.all(to, this._api);
        const { partialFee } = await this._api.tx.balances.transfer(to, balanceFrom.availableBalance)
            .paymentInfo(from).toJSON();
        const transactionFeeInDot = 10e-10 * partialFee;
        const usd = Math.trunc(transactionFeeInDot * Number(dotToUSD.data.usd) * 100) / 100;
        return {
            value: transactionFeeInDot,
            usd
        };
    }
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    async getTransactionsHistoryByAddress(address) {
        const { data: ethToUSD } = await axios.get(`${backendApi}coins/DOT`, {
            headers: {
                'auth-client-key': backendApiKey
            }
        });
        const { data: { data: data } } = await axios.get(`${blockChairAPI}${address}`);
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
        return transactions;
    }
    async sendMainToken(data) {
        const transactionHash = await this._api.tx.balances.transfer(data.receiverAddress, data.amount);
        transactionHash.signAndSend(this._publicKey);
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
        throw new CustomError('Network doesnt support this method', 14, ErrorsTypes['Unknown error']);
        ;
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
            tokenLogo
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
        const amount = Math.trunc(txData.amount * 10e-8) / 100;
        let amountPriceInUSD = tokenPriceToUSD;
        amountPriceInUSD = Math.trunc(amountPriceInUSD * amount * 100) / 100;
        const tokenLogo = imagesURL + symbol.toUpperCase() + '.svg';
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
            status: !txData.failed,
            tokenLogo
        };
    }
}
//# sourceMappingURL=Polkadot.service.js.map