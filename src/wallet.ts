import { ChainIds, ErrorsTypes } from './models/enums';
import { IChainService } from './models/chainService';
import { IBalanceInfo, IWalletData } from './models/wallet';
import { IFee, ISendingTransactionData, ITransactionsData } from './models/transaction';

import { tronService } from './services/Tron.service';
import { ethereumService } from './services/Ethereum.service';
import { binanceService } from './services/Binance.service';
import { bitcoinService } from './services/Bitcoin.service';
import { CustomError } from './errors';
import { solanaService } from './services/Solana.service';
import { polygonService } from './services/Polygon.service';
import { litecoinService } from './services/Litecoin.service';
import { ethereumClassicService } from './services/EthereumClassic.service';
import { bitcoincashService } from './services/Bitcoincash.service';
import { dogecoinService } from './services/Dogecoin.service';
import { dashService } from './services/Dash.service';
import { zcashService } from './services/Zcash.service';
import { rippleService } from './services/Ripple.service';
import { polkadotService } from './services/Polkadot.service';

import { harmonyService } from './services/Harmony.service';
import { avalancheService } from './services/Avalanche.service';

export class Wallet {
  private service: IChainService;
  private isInitialized = false;

  private data: IWalletData = {
    privateKey: null,
    publicKey: null,
    chainId: null,
    mnemonic: null,
  };

  /**
   * return wallet chain id
   * @returns {string}
   */
  get chainId(): string {
    return ChainIds[+this.data.chainId];
  }

  /**
   * return wallet address
   * @returns {string}
   */
  get address(): string {
    return this.data.publicKey;
  }

  /**
   * return wallet private key
   * @returns {string}
   */
  get privateKey(): string {
    return this.data.privateKey;
  }

  /**
   * return wallet mnemonic phrase
   * @returns {string}
   */
  get mnemonic(): string {
    return this.data.mnemonic;
  }

  /**
   * return wallet initialize status
   * @returns {boolean}
   */
  get isWalletInitialized(): boolean {
    return this.isInitialized;
  }

  constructor(chainId: ChainIds, mnemonic: string, privateKey?: string) {
    this.data.chainId = chainId;
    this.data.mnemonic = mnemonic;

    if (privateKey) {
      this.data.privateKey = privateKey;
    }

    this.selectChainService(chainId);
  }

  /**
   * generate wallet keys
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    await this.createKeys();

    this.isInitialized = true;
  }

  /**
   * Return tokens by wallet address
   * @returns {Promise<IToken[]>}
   */
  async getTokensByAddress(): Promise<IBalanceInfo> {
    try {
      const tokens = await this.service.getTokensByAddress(this.data.publicKey);

      let totalBalanceInUSD = tokens.reduce((balance, x) => balance + x.balanceInUSD, 0);
      totalBalanceInUSD = Math.trunc(totalBalanceInUSD * 100) / 100;

      return { tokens, totalBalanceInUSD };
    } catch (error: any) {
      console.error(error);

      throw new CustomError(
        `An error occurred while receiving wallet tokens info from ${this.chainId} network`,
        3,
        ErrorsTypes['Network error'],
        error
      );
    }
  }

  /**
   * Return wallet transactions
   * @param  {number} pageNumber
   * @param {number} pageSize
   * @returns {Promise<ITransactionsData>}
   */
  async getTransactionsHistoryByAddress(pageNumber?: number, pageSize?: number, tokenType?: string): Promise<ITransactionsData> {
    try {
      return await this.service.getTransactionsHistoryByAddress(this.data.publicKey, pageNumber, pageSize, tokenType);
    } catch (error: any) {
      console.error(error);
      throw new CustomError(
        `An error occurred while receiving wallet transactions history info from ${this.chainId} network`,
        5,
        ErrorsTypes['Network error'],
        error
      );
    }
  }

  /**
   * Returns the current fee price oracle.
   * @param {string} receiverAddress
   * @param {number} amount:number
   * @param {'native'|'custom'} tokenType:by default = 'native'
   * @param {'slow'|'medium'|'fast'} rate:by default = 'medium'
   * @returns {Promise<IFee>}
   */
  async getFeePriceOracle(
    receiverAddress: string,
    amount: number,
    tokenType: 'native' | 'custom' = 'native',
    rate: 'slow' | 'medium' | 'fast' = 'medium'
  ): Promise<IFee> {
    try {
      return await this.service.getFeePriceOracle(this.data.publicKey, receiverAddress, amount, tokenType, rate);
    } catch (error: any) {
      console.error(error);
      throw new CustomError(
        `An error occurred while calculating transaction fee price for ${this.chainId} network`,
        6,
        ErrorsTypes['Network error'],
        error
      );
    }
  }

  /**
   * send current chain main token e.g. ETH, BTC or TRX. Retutn transaction hash
   * @param {ISendingTransactionData} data:ISendingTransactionData
   * @returns {Promise<void>}
   */
  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    console.log(data);

    if (data.amount == null) {
      throw new CustomError(`You have not passed the amount of native tokens to send`, 7, ErrorsTypes['Insufficient data']);
    }

    if (data.receiverAddress == null || data.receiverAddress.trim() === '') {
      throw new CustomError(`You have not passed receiver address`, 8, ErrorsTypes['Insufficient data']);
    }

    try {
      return await this.service.sendMainToken(data);
    } catch (error: any) {
      console.log(error);

      throw new CustomError(
        `An error occurred while sending native tokens in ${this.chainId} network`,
        9,
        ErrorsTypes['Network error'],
        error
      );
    }
  }

  /**
   * send 20 token e.g. ERC-20 or TRC-20. Return transaction hash
   * @param {ISendingTransactionData} data:ISendingTransactionData
   * @returns {Promise<string>}
   */
  async send20Token(data: ISendingTransactionData): Promise<string> {
    if (data.amount == null) {
      throw new CustomError(`You have not passed the amount of custom tokens to send`, 10, ErrorsTypes['Insufficient data']);
    }

    if (data.receiverAddress == null || data.receiverAddress.trim() === '') {
      throw new CustomError(`You have not passed receiver address`, 11, ErrorsTypes['Insufficient data']);
    }

    if (data.cotractAddress == null || data.cotractAddress.trim() === '') {
      throw new CustomError(`You have not passed contract address of custom token`, 12, ErrorsTypes['Insufficient data']);
    }

    try {
      return await this.service.send20Token({ ...data, privateKey: this.data.privateKey });
    } catch (error: any) {
      throw new CustomError(
        `An error occurred while sending custom tokens in ${this.chainId} network`,
        13,
        ErrorsTypes['Network error'],
        error
      );
    }
  }

  /**
   * select chain service for wallet
   * @param {chainId} chainId:ChainIds
   * @returns {void}
   */
  private selectChainService(chainId: ChainIds): void {
    try {
      switch (+chainId) {
        case ChainIds['Ethereum']:
          this.service = new ethereumService();
          break;
        case ChainIds['Tron']:
          this.service = new tronService();
          break;
        case ChainIds['Binance']:
          this.service = new binanceService();
          break;
        case ChainIds['Solana']:
          this.service = new solanaService();
          break;
        case ChainIds['Bitcoin']:
          this.service = new bitcoinService();
          break;
        case ChainIds['Polygon']:
          this.service = new polygonService();
          break;
        case ChainIds['Litecoin']:
          this.service = new litecoinService();
          break;
        case ChainIds['EthereumClassic']:
          this.service = new ethereumClassicService();
          break;
        case ChainIds['Bitcoincash']:
          this.service = new bitcoincashService();
          break;
        case ChainIds['Dogecoin']:
          this.service = new dogecoinService();
          break;
        case ChainIds['Dash']:
          this.service = new dashService();
          break;
        case ChainIds['Zcash']:
          this.service = new zcashService();
          break;
        case ChainIds['Ripple']:
          this.service = new rippleService();
          break;
        // case ChainIds['Polkadot']:
        //   this.service = new polkadotService();
        //   break;
        case ChainIds['Harmony']:
          this.service = new harmonyService();
          break;
        case ChainIds['Avalanche']:
          this.service = new avalancheService();
          break;
      }
    } catch (error: any) {
      throw new CustomError(
        `An error occurred while generating keys for ${this.chainId}`,
        2,
        ErrorsTypes['Unknown error'],
        error
      );
    }
  }

  /**
   * set main wallet data like address and private key
   */
  private async createKeys(): Promise<void> {
    try {
      if (this.data.privateKey) {
        const pubKey = await this.service.generatePublicKey(this.data.privateKey);
        this.data.publicKey = pubKey;

        return;
      }

      const data = await this.service.generateKeyPair(this.data.mnemonic);
      this.data.privateKey = data.privateKey;
      this.data.publicKey = data.publicKey;
    } catch (error: any) {
      console.log(error);

      throw new CustomError(
        `An error occurred while generating keys for ${this.chainId}`,
        1,
        ErrorsTypes['Unknown error'],
        error
      );
    }
  }
}
