import { ChainIds } from "./models/enums";
import { tronService } from "./services/Tron.service";

import { IChainService } from "./models/chainService";
import { ethereumService } from "./services/Ethereum.service";
import { IToken } from "./models/token";
import { IWalletData } from "./models/wallet";
import { ISendingTransactionData, ITransaction } from "./models/transaction";

export class Wallet {
  service: IChainService;

  private isInitialized = false;
  private data: IWalletData = {
    privateKey: null,
    publicKey: null,
    chainId: null,
    mnemonic: null,
  };

  /**
   * return wallet chain name
   * @returns {string}
   */
  get chainName(): string {
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
   * Return tokens by received address. By default address is current wallet address
   * @param {any} address?:string
   * @returns {Promise<IToken[]>}
   */
  async getTokensByAddress(address?: string): Promise<IToken[]> {
    return await this.service.getTokensByAddress(
      address || this.data.publicKey
    );
  }

  /**
   * Return transactions by received address. By default address is current wallet address
   * @param {any} address?:string
   * @returns {Promise<ITransaction[]>}
   */
  async getTransactionsHistoryByAddress(
    address?: string
  ): Promise<ITransaction[]> {
    return await this.service.getTransactionsHistoryByAddress(
      address || this.data.publicKey
    );
  }

  /**
   * send current chain main token e.g. ETH, BTC or TRX
   * @param {any} data:ISendingTransactionData
   * @returns {Promise<void>}
   */
  async sendMainToken(data: ISendingTransactionData): Promise<void> {
    return await this.service.sendMainToken(data);
  }

  /**
   * send 20 token e.g. ERC-20 or TRC-20
   * @param {any} data:ISendingTransactionData
   * @returns {Promise<void>}
   */
  async send20Token(data: ISendingTransactionData): Promise<void> {
    return await this.service.send20Token(data);
  }

  /**
   * select chain service for wallet
   * @param {any} chainId:ChainIds
   * @returns {void}
   */
  private selectChainService(chainId: ChainIds): void {
    switch (+chainId) {
      case ChainIds["Ethereum"]:
        console.log("Ether");
        this.service = new ethereumService();
        break;
      case ChainIds["Tron"]:
        console.log("Tron");
        this.service = new tronService();
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
