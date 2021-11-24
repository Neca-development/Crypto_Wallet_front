import { ChainIds } from './models/enums';
import { IChainService } from './models/chainService';
import { IToken } from './models/token';
import { IWalletData } from './models/wallet';
import { IFee, ISendingTransactionData, ITransaction } from './models/transaction';

import { tronService } from './services/Tron.service';
import { ethereumService } from './services/Ethereum.service';
import { binanceService } from './services/Binance.service';

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

  constructor(chainId: ChainIds, mnemonic: string) {
    this.data.chainId = chainId;
    this.data.mnemonic = mnemonic;

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
   * return total wallet balance in USD
   * @returns {number}
   */
  async getTotalBalanceInUSD(): Promise<number> {
    const tokens = await this.getTokensByAddress();
    const balance = tokens.reduce((balance, x) => balance + x.balanceInUSD, 0);

    return Math.trunc(balance * 100) / 100;
  }

  /**
   * Return tokens by wallet address
   * @returns {Promise<IToken[]>}
   */
  async getTokensByAddress(): Promise<IToken[]> {
    return await this.service.getTokensByAddress(this.data.publicKey);
  }

  /**
   * Return wallet transactions
   * @returns {Promise<ITransaction[]>}
   */
  async getTransactionsHistoryByAddress(): Promise<ITransaction[]> {
    return await this.service.getTransactionsHistoryByAddress(this.data.publicKey);
  }

  /**
   * Returns the current fee price oracle.
   * @param {string} receiverAddress
   * @returns {Promise<IFee>}
   */
  async getFeePriceOracle(receiverAddress: string): Promise<IFee> {
    return await this.service.getFeePriceOracle(this.data.publicKey, receiverAddress);
  }

  /**
   * send current chain main token e.g. ETH, BTC or TRX
   * @param {ISendingTransactionData} data:ISendingTransactionData
   * @returns {Promise<void>}
   */
  async sendMainToken(data: ISendingTransactionData): Promise<void> {
    return await this.service.sendMainToken(data);
  }

  /**
   * send 20 token e.g. ERC-20 or TRC-20
   * @param {ISendingTransactionData} data:ISendingTransactionData
   * @returns {Promise<void>}
   */
  async send20Token(data: ISendingTransactionData): Promise<void> {
    return await this.service.send20Token(data);
  }

  /**
   * select chain service for wallet
   * @param {chainId} chainId:ChainIds
   * @returns {void}
   */
  private selectChainService(chainId: ChainIds): void {
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

      default:
        break;
    }
  }

  /**
   * set main wallet data like address and private key
   */
  private async createKeys(): Promise<void> {
    const data = await this.service.createWallet(this.data.mnemonic);
    this.data.privateKey = data.privateKey;
    this.data.publicKey = data.publicKey;
  }
}
