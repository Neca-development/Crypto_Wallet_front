/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IResponse } from '../models/response';
import { ITransaction } from '../models/transaction';

import {
  harmonyProvider,
  backendApi,
  imagesURL,
  bitqueryProxy,
  harmonyUSDTContractAddress,
} from '../constants/providers';
import { backendApiKey } from './../constants/providers';
import { oneUSDTAbi } from '../constants/one-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ethers } from 'ethers';
import { ICryptoCurrency, IToken } from '../models/token';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';
import converter from "bech32-converting"

export class harmonyService implements IChainService {
  private web3: Web3;

  constructor() {
    this.web3 = new Web3(harmonyProvider);
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    this.web3.eth.accounts.wallet.add(this.web3.eth.accounts.privateKeyToAccount(wallet.privateKey));
    this.web3.eth.defaultAccount = wallet.address;
    const harmonyAddress = converter('one').toBech32(wallet.address)

    return {
      privateKey: wallet.privateKey,
      publicKey: harmonyAddress,
    };
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    const harmonyAddress = converter('one').toBech32(address)
    return harmonyAddress;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    // const { data: oneToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ONE`, {
    //   headers: {
    //     'auth-client-key': backendApiKey,
    //   },
    // });
    const oneToUSD = {
      data: {
        usd: '0.22',
        usdt: '1'
      }
    }
    const ethAddress = this.getEthAddress(address)

    const nativeTokensBalance = await this.web3.eth.getBalance(ethAddress);
    const USDTTokenBalance = await this.getCustomTokenBalance(ethAddress, harmonyUSDTContractAddress);

    tokens.push(
      this.generateTokenObject(
        Number(this.web3.utils.fromWei(nativeTokensBalance)),
        'ONE',
        imagesURL + 'ONE.svg',
        'native',
        oneToUSD.data.usd
      )
    );

    tokens.push(
      this.generateTokenObject(
        USDTTokenBalance,
        'Tether USDT',
        imagesURL + 'USDT.svg',
        'custom',
        oneToUSD.data.usd,
        oneToUSD.data.usdt,
        harmonyUSDTContractAddress
      )
    );

    return tokens;
  }

  async getFeePriceOracle(): Promise<IFee> {
    // const { data: oneToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ONE`, {
    //   headers: {
    //     'auth-client-key': backendApiKey,
    //   },
    // });
    const oneToUSD = {
      data: {
        usd: '0.22'
      }
    }

    const gasPrice = await this.web3.eth.getGasPrice()
    const gasPriceInOne = this.web3.utils.fromWei(gasPrice)
    const gasLimit = 6721900;

    const transactionFeeInOne = +gasPriceInOne * gasLimit
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
  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    // const { data: oneToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ONE`, {
    //   headers: {
    //     'auth-client-key': backendApiKey,
    //   },
    // });
    const oneToUSD = {
      data: {
        usd: '0.22',
        usdt: '1'
      }
    }

    const result = await axios.post(harmonyProvider, {
      jsonrpc: 2.0,
      method: 'hmyv2_getTransactionsHistory',
      params: [{
        address: '0x5b104aa1ddcc1cf5ff5d88869f46321cb139fd1d',
        pageIndex: 0,
        pageSize: 1000,
        fullTx: true,
        txType: 'ALL',
        order: 'ASC'
      }],
      id: 1
    })
    const history = result.data.result.transactions

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

    transactions = history.map((el: any) =>
      this.convertTransactionToCommonFormat(el, address, Number(oneToUSD.data.usd), Number(oneToUSD.data.usdt))
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

    return transactions;
  }

  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    const gasPrice = await this.web3.eth.getGasPrice();
    const gasLimit = 6721900;

    const recieverEth = this.getEthAddress(data.receiverAddress)

    const transactionObject = {
      from: this.web3.eth.defaultAccount,
      to: recieverEth,
      value: this.web3.utils.numberToHex(this.web3.utils.toWei(data.amount.toString())).toString(),
      gasPrice,
      gasLimit
    };

    const result = await this.web3.eth.sendTransaction(transactionObject);

    return result.transactionHash;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    const tokenAddress = data.cotractAddress;
    const contract = new this.web3.eth.Contract(oneUSDTAbi as any, tokenAddress);
    const decimals = getBNFromDecimal(+(await contract.methods.decimals().call()));
    const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
    const recieverEth = this.getEthAddress(data.receiverAddress)
    const result = await contract.methods
      .transfer(recieverEth, this.web3.utils.toHex(amount))
      .approve(this.web3.eth.defaultAccount, this.web3.utils.toHex(amount))
    console.log(result);

    return result.transactionHash;
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

  private async getCustomTokenBalance(address: string, contractAddress: string): Promise<number> {
    const contract = new this.web3.eth.Contract(oneUSDTAbi as any, contractAddress);
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
    oneToUSD: string,
    oneToCustomToken?: string,
    contractAddress?: string
  ): IToken {
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

  private generateTransactionsQuery(address: string, direction: 'receiver' | 'sender') {
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
  private convertTransactionToCommonFormat(
    txData: any,
    address: string,
    tokenPriceToUSD: number,
    nativeTokenToUSD: number
  ): ITransaction {
    const amount = txData.value * 1e-18

    // let amountPriceInUSD = txData.currency.symbol === 'ONE' ? tokenPriceToUSD : (1 / nativeTokenToUSD) * tokenPriceToUSD;
    console.log(nativeTokenToUSD)
    let amountPriceInUSD = tokenPriceToUSD
    amountPriceInUSD = Math.trunc(amountPriceInUSD * amount * 100) / 100;

    // const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
    const tokenLogo = imagesURL + 'ONE.svg'
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
      status: true,
      tokenLogo,
    };
  }

  private getEthAddress(address: string) {
    if (address.substring(0, 3) === 'one') {
      return converter('one').toHex(address)
    } else {
      return address
    }
  }
}