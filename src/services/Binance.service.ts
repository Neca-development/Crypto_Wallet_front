/* eslint-disable @typescript-eslint/ban-ts-comment */
import {IFee, ISendingTransactionData, ITransactionsData} from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { ICryptoCurrency, IToken } from '../models/token';

import { getBNFromDecimal } from '../utils/numbers';

import { backendApi, backendApiKey, bitqueryProxy, imagesURL } from '../constants/providers';
import { binanceWeb3Provider, binanceUSDTContractAddress } from '../constants/providers';
import { bnbUSDTAbi } from '../constants/bnb-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { IResponse } from '../models/response';
export class binanceService implements IChainService {
  private web3: Web3;

  constructor() {
    this.web3 = new Web3(binanceWeb3Provider);
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    this.web3.eth.accounts.wallet.add(this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey));
    this.web3.eth.defaultAccount = wallet.address;

    return {
      privateKey: wallet.privateKey,
      publicKey: wallet.address,
    };
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    return address;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    const { data: bnbToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BNB`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const nativeTokensBalance = await this.web3.eth.getBalance(address);
    const USDTTokenBalance = await this.getCustomTokenBalance(address, binanceUSDTContractAddress);

    tokens.push(
      this.generateTokenObject(
        Number(this.web3.utils.fromWei(nativeTokensBalance)),
        'BNB',
        imagesURL + 'BNB.svg',
        'native',
        bnbToUSD.data.usd
      )
    );

    tokens.push(
      this.generateTokenObject(
        USDTTokenBalance,
        'Tether USDT',
        imagesURL + 'USDT.svg',
        'custom',
        bnbToUSD.data.usd,
        bnbToUSD.data.usdt,
        binanceUSDTContractAddress
      )
    );

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string, amount?: number, tokenType?: 'custom' | 'native'): Promise<IFee> {
    const { data: bnbToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BNB`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const fee = await this.web3.eth.estimateGas({
      from,
      to,
    });

    let value = await this.web3.eth.getGasPrice();
    value = tokenType == 'native' ? (+this.web3.utils.fromWei(value) * fee).toString() : (amount * 0.01).toString();

    const usd = Math.trunc(+value * Number(bnbToUSD.data.usd) * 100) / 100;

    return {
      value: Number(value),
      usd: usd,
    };
  }

  async getTransactionsHistoryByAddress(address: string, pageNumber?:number, pageSize?:number, tokenType?:string): Promise<ITransactionsData> {
    const { data: bnbToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/BNB`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const queries = [];
    let transactions = [];

    queries.push(this.generateTransactionsQuery(address, 'receiver'));
    queries.push(this.generateTransactionsQuery(address, 'sender'));

    for (const query of queries) {
      let { data: resp } = await axios.post(
        bitqueryProxy,
        {
          body: { query: query, variables: {} },
        },
        {
          headers: {
            'auth-client-key': backendApiKey,
          },
        }
      );

      transactions.push(...resp.data.data.ethereum.transfers);
    }

    if (transactions.length === 0) {
      return {transactions:[], length:0};
    }

    transactions = transactions.map((el: any) =>
      this.convertTransactionToCommonFormat(el, address, Number(bnbToUSD.data.usd), Number(bnbToUSD.data.usdt))
    );

    transactions.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return -1;
      } else if (a.timestamp < b.timestamp) {
        return 1;
      } else {
        return 0;
      }
    });
    if(tokenType!='all'){
      if(tokenType=='native'){
        transactions = transactions.filter((tx)=>{
          return tx.tokenName == "BNB"
        })
      }else{
        transactions = transactions.filter((tx)=>{
          return tx.tokenName == tokenType.toUpperCase()
        })
      }
    }
    const length = transactions.length
    if(pageNumber || pageNumber===0) {
      transactions = transactions.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    }
    return {
      transactions, length
    };
  }

  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    const gasPrice = await this.web3.eth.getGasPrice();
    const gasCount = await this.web3.eth.estimateGas({
      value: this.web3.utils.toWei(data.amount.toString()),
    });

    const result = await this.web3.eth.sendTransaction({
      from: this.web3.eth.defaultAccount,
      to: data.receiverAddress,
      value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())),
      gasPrice: gasPrice,
      gas: gasCount,
    });

    return result.transactionHash;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    const tokenAddress = data.cotractAddress;
    const contract = new this.web3.eth.Contract(bnbUSDTAbi as any, tokenAddress);
    const decimals = getBNFromDecimal(+(await contract.methods._decimals().call()));
    const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
    const result = await contract.methods
      .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
      .send({ from: this.web3.eth.defaultAccount, gas: 100000 });

    return result.transactionHash;
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

  private async getCustomTokenBalance(address: string, contractAddress: string): Promise<number> {
    const contract = new this.web3.eth.Contract(bnbUSDTAbi as any, contractAddress);
    const decimals = getBNFromDecimal(Number(await contract.methods.decimals().call()));

    let balance = await contract.methods.balanceOf(address).call();
    balance = new BigNumber(balance).dividedBy(decimals);

    return balance.toNumber();
  }

  private generateTokenObject(
    balance: number,
    tokenName: string,
    tokenLogo: string,
    tokenType: 'native' | 'custom',
    bnbToUSD: string,
    bnbToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(bnbToCustomToken)) * Number(bnbToUSD) : Number(bnbToUSD);
    tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;

    const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
    const standard = tokenType === 'custom' ? 'BEP 20' : null;

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

  private generateTransactionsQuery(address: string, direction: 'receiver' | 'sender') {
    return `
      query{
      ethereum(network: bsc) {
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
  private convertTransactionToCommonFormat(
    txData: any,
    address: string,
    tokenPriceToUSD: number,
    nativeTokenToUSD: number
  ): ITransaction {
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
      txId: txData.transaction.hash,
      direction,
      type: txData.tokenType,
      tokenName: txData.currency.symbol,
      timestamp: new Date(txData.any).getTime(),
      fee: txData.fee,
      currencyFee: 'BNB',
      status: txData.success,
      tokenLogo,
    };
  }
}
