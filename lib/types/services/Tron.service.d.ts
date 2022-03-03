import { IFee, ISendingTransactionData, ITransactionsData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IToken } from '../models/token';
import TronWeb from 'tronweb';
export declare class tronService implements IChainService {
    Tron: TronWeb;
    constructor();
    generatePublicKey(privateKey: string): Promise<string>;
    generateKeyPair(mnemonic: string): Promise<IWalletKeys>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string, amount: number, tokenType?: 'native' | 'custom'): Promise<IFee>;
    getTransactionsHistoryByAddress(address: string, pageNumber?: number, pageSize?: number): Promise<ITransactionsData>;
    sendMainToken(data: ISendingTransactionData): Promise<any>;
    send20Token(data: ISendingTransactionData): Promise<any>;
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
//# sourceMappingURL=Tron.service.d.ts.map