import { ChainIds } from './models/enums';
import { IBalanceInfo } from './models/wallet';
import { IFee, ISendingTransactionData, ITransaction } from './models/transaction';
export declare class Wallet {
    private service;
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
    constructor(chainId: ChainIds, mnemonic: string, privateKey?: string);
    /**
     * generate wallet keys
     * @returns {Promise<void>}
     */
    init(): Promise<void>;
    /**
     * Return tokens by wallet address
     * @returns {Promise<IToken[]>}
     */
    getTokensByAddress(): Promise<IBalanceInfo>;
    /**
     * Return wallet transactions
     * @returns {Promise<ITransaction[]>}
     */
    getTransactionsHistoryByAddress(): Promise<ITransaction[]>;
    /**
     * Returns the current fee price oracle.
     * @param {string} receiverAddress
     * @returns {Promise<IFee>}
     */
    getFeePriceOracle(receiverAddress: string): Promise<IFee>;
    /**
     * send current chain main token e.g. ETH, BTC or TRX. Retutn transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    sendMainToken(data: ISendingTransactionData): Promise<string>;
    /**
     * send 20 token e.g. ERC-20 or TRC-20. Return transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<string>}
     */
    send20Token(data: ISendingTransactionData): Promise<string>;
    /**
     * select chain service for wallet
     * @param {chainId} chainId:ChainIds
     * @returns {void}
     */
    private selectChainService;
    /**
     * set main wallet data like address and private key
     */
    private createKeys;
}
//# sourceMappingURL=wallet.d.ts.map