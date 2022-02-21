/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IResponse } from '../models/response';
import { ITransaction } from '../models/transaction';

import { ethWeb3Provider, etherGasPrice, backendApi, imagesURL, bitqueryProxy, avaxAssetId } from '../constants/providers';
import { backendApiKey } from '../constants/providers';
import { etherUSDTAbi } from '../constants/eth-USDT.abi';

// @ts-ignore
import axios from 'axios';
import Web3 from 'web3';

import { TestnetConfig, setNetwork } from '@avalabs/avalanche-wallet-sdk';
import { Avalanche, avm, BN, HDNode, Mnemonic } from 'avalanche';

// Set to Fuji Testnet
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ICryptoCurrency, IToken } from '../models/token';
import { getBNFromDecimal } from '../utils/numbers';
import { BigNumber } from 'bignumber.js';

export class avalancheService implements IChainService {
  private web3: Web3;
  private xchain: avm.AVMAPI;
  private keys;

  constructor() {
    this.web3 = new Web3(ethWeb3Provider);
    setNetwork(TestnetConfig);

    const { apiIp: ip, apiPort: port, apiProtocol: protocol, networkID } = TestnetConfig;
    const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
    this.xchain = avalanche.XChain();
  }

  async generateKeyPair(mnemonic: string): Promise<IWalletKeys> {
    const mnemonicInst: Mnemonic = Mnemonic.getInstance();

    const xKeychain = this.xchain.keyChain();
    const seed = mnemonicInst.mnemonicToSeedSync(mnemonic);
    const hdnode: HDNode = new HDNode(seed);
    const child: HDNode = hdnode.derive(`m/44'/9000'/0'/0/0`);

    xKeychain.importKey(child.privateKeyCB58);

    const keys = xKeychain.getKey(xKeychain.getAddresses()[0]);
    const publicKey = keys.getAddressString();
    const privateKey = keys.getPrivateKeyString();

    this.keys = {
      privateKey,
      publicKey,
    };

    return this.keys;
  }

  async generatePublicKey(privateKey: string): Promise<string> {
    const { address } = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    return address;
  }

  async getTokensByAddress(address: string) {
    const tokens: Array<IToken> = [];
    const { data: ethToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const AVAX: any = await this.xchain.getBalance(address, 'AVAX');

    const nativeTokensBalance = AVAX.balance / 1e9;

    tokens.push(this.generateTokenObject(nativeTokensBalance, 'AVAX', imagesURL + 'AVAX.svg', 'native', ethToUSD.data.usd));

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string): Promise<IFee> {
    const { data: ethToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const transactionObject = {
      from,
      to,
    };
    const gasLimit = await this.web3.eth.estimateGas(transactionObject);

    let { data: price } = await axios.get(etherGasPrice);
    const gasPriceGwei = price.fast / 10;

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
  async getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]> {
    const { data: ethToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/ETH`, {
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
      return [];
    }

    transactions = transactions.map((el: any) =>
      this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), Number(ethToUSD.data.usdt))
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
    const address = this.keys.publicKey;

    let { utxos } = await this.xchain.getUTXOs(address);

    let sendAmount = new BN(data.amount * 1e9); //amounts are in BN format

    let unsignedTx = await this.xchain.buildBaseTx(utxos, sendAmount, avaxAssetId, [data.receiverAddress], [address], [address]);

    let signedTx = unsignedTx.sign(this.xchain.keyChain());
    let txid = await this.xchain.issueTx(signedTx);

    return txid;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    const tokenAddress = data.cotractAddress;
    const contract = new this.web3.eth.Contract(etherUSDTAbi as any, tokenAddress);
    const decimals = getBNFromDecimal(+(await contract.methods.decimals().call()));
    const amount = new BigNumber(data.amount).multipliedBy(decimals).toNumber();
    const result = await contract.methods
      .transfer(data.receiverAddress, this.web3.utils.toHex(amount))
      .send({ from: this.web3.eth.defaultAccount, gas: 100000 });
    console.log(result);

    return result.transactionHash;
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

  private async getCustomTokenBalance(address: string, contractAddress: string): Promise<number> {
    const contract = new this.web3.eth.Contract(etherUSDTAbi as any, contractAddress);
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
    ethToUSD: string,
    ethToCustomToken?: string,
    contractAddress?: string
  ): IToken {
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

  private generateTransactionsQuery(address: string, direction: 'receiver' | 'sender') {
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
  private convertTransactionToCommonFormat(
    txData: any,
    address: string,
    tokenPriceToUSD: number,
    nativeTokenToUSD: number
  ): ITransaction {
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
