/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IResponse } from '../models/response';
import { ITransaction } from '../models/transaction';

import { backendApi, imagesURL } from '../constants/providers';
import { backendApiKey } from '../constants/providers';

// @ts-ignore
import axios from 'axios';

import { TestnetConfig } from '@avalabs/avalanche-wallet-sdk';
import { Avalanche, avm, BN, HDNode, Mnemonic, utils } from 'avalanche';

// Set to Fuji Testnet
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ICryptoCurrency, IToken } from '../models/token';
import { BigNumber } from 'bignumber.js';

export class avalancheService implements IChainService {
  private xchain: avm.AVMAPI;
  private keys;
  private networkConfog = TestnetConfig;
  private avaxAssetId: string = utils.Defaults.network[this.networkConfog.networkID].X['avaxAssetID'];

  constructor() {
    const { apiIp: ip, apiPort: port, apiProtocol: protocol, networkID } = this.networkConfog;
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
    const xKeychain = this.xchain.keyChain();
    xKeychain.importKey(privateKey);

    const keys = xKeychain.getKey(xKeychain.getAddresses()[0]);
    const publicKey = keys.getAddressString();

    this.keys = {
      privateKey,
      publicKey,
    };

    return publicKey;
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

    const value = this.xchain.getDefaultTxFee().toNumber() / 1e9;

    const usd = Math.trunc(value * Number(ethToUSD.data.usd) * 100) / 100;

    return {
      value,
      usd,
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
    console.log(ethToUSD);

    console.log(await this.xchain.getAddressTxs(address, null, null, this.avaxAssetId));

    let transactions = [];

    return [];
  }

  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    const address = this.keys.publicKey;

    let { utxos } = await this.xchain.getUTXOs(address);
    let sendAmount = new BN(data.amount * 1e9); //amounts are in BN format

    let unsignedTx = await this.xchain.buildBaseTx(
      utxos,
      sendAmount,
      this.avaxAssetId,
      [data.receiverAddress],
      [address],
      [address]
    );
    let signedTx = unsignedTx.sign(this.xchain.keyChain());
    let txid = await this.xchain.issueTx(signedTx);

    return txid;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    throw new Error('Avalance Xchain doesnt support this method');
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

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
