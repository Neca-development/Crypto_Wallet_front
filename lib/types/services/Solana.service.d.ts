import { IChainService, ISendingTransactionData, IToken } from '../main';
import { IFee, ITransactionsData } from '../models/transaction';
export declare class solanaService implements IChainService {
    private address;
    private connection;
    constructor();
    generateKeyPair(mnemonic: string): Promise<{
        privateKey: string;
        publicKey: string;
    }>;
    generatePublicKey(privateKey: string): Promise<string>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string, amount?: number | null, tokenTypes?: 'native' | 'custom'): Promise<IFee>;
    sendMainToken(data: ISendingTransactionData): Promise<string>;
    send20Token(data: ISendingTransactionData): Promise<string>;
    getTransactionsHistoryByAddress(address: any, page_number?: number, page_size?: number): Promise<ITransactionsData>;
    private generateTokenObject;
    private generateTransactionsQuery;
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    private convertTransactionToCommonFormat;
}
//# sourceMappingURL=Solana.service.d.ts.map