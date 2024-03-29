import { IFee, ISendingTransactionData, ITransactionsData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IToken } from '../models/token';
export declare class polygonService implements IChainService {
    private web3;
    constructor();
    generateKeyPair(mnemonic: string): Promise<IWalletKeys>;
    generatePublicKey(privateKey: string): Promise<string>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string, amount?: number | null, tokenType?: 'native' | 'custom'): Promise<IFee>;
    getTransactionsHistoryByAddress(address: string, pageNumber?: number, pageSize?: number, tokenType?: string): Promise<ITransactionsData>;
    sendMainToken(data: ISendingTransactionData): Promise<string>;
    send20Token(data: ISendingTransactionData): Promise<string>;
    private getCustomTokenBalance;
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
//# sourceMappingURL=Polygon.service.d.ts.map