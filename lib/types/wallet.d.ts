import { ChainIds } from "./models/enums";
import { IChainService } from "./models/chainService";
import { IToken } from "./models/token";
import { ISendingTransactionData, ITransaction } from "./models/transaction";
export declare class Wallet {
    service: IChainService;
    private isInitialized;
    private data;
    /**
     * return wallet chain id
     * @returns {string}
     */
    get chainId(): string;
    /**
     * return wallet address
     * @returns {string}
     */
    get address(): string;
    /**
     * return wallet private key
     * @returns {string}
     */
    get privateKey(): string;
    /**
     * return wallet mnemonic phrase
     * @returns {string}
     */
    get mnemonic(): string;
    /**
     * return wallet initialize status
     * @returns {boolean}
     */
    get isWalletInitialized(): boolean;
    constructor(chainId: ChainIds, mnemonic: string);
    /**
     * generate wallet keys
     * @returns {Promise<void>}
     */
    init(): Promise<void>;
    /**
     * Return tokens by received address. By default address is current wallet address
     * @param {any} address?:string
     * @returns {Promise<IToken[]>}
     */
    getTokensByAddress(address?: string): Promise<IToken[]>;
    /**
     * Return transactions by received address. By default address is current wallet address
     * @param {any} address?:string
     * @returns {Promise<ITransaction[]>}
     */
    getTransactionsHistoryByAddress(address?: string): Promise<ITransaction[]>;
    /**
     * send current chain main token e.g. ETH, BTC or TRX
     * @param {any} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    sendMainToken(data: ISendingTransactionData): Promise<void>;
    /**
     * send 20 token e.g. ERC-20 or TRC-20
     * @param {any} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    send20Token(data: ISendingTransactionData): Promise<void>;
    /**
     * select chain service for wallet
     * @param {any} chainId:ChainIds
     * @returns {void}
     */
    private selectChainService;
    /**
     * set main wallet data like address and private key
     */
    private createKeys;
}
//# sourceMappingURL=wallet.d.ts.map