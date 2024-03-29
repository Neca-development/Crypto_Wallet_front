import { IToken } from './token';
import { IFee, ISendingTransactionData, ITransactionsData } from './transaction';
export interface IChainService {
    generateKeyPair(mnemonic: string): any;
    generatePublicKey(privateKey: string): Promise<string>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getTransactionsHistoryByAddress(address: string, pageNumber?: number, pageSize?: number, tokenType?: string): Promise<ITransactionsData>;
    getFeePriceOracle(from: string, to: string, amount: number, tokenType: 'native' | 'custom', speed: 'slow' | 'medium' | 'fast'): Promise<IFee>;
    sendMainToken(data: ISendingTransactionData): Promise<string>;
    send20Token(data: ISendingTransactionData): Promise<string>;
}
//# sourceMappingURL=chainService.d.ts.map