import { IFee, ISendingTransactionData, ITransactionsData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { IToken } from '../models/token';
export declare class litecoinService implements IChainService {
    private keys;
    private network;
    constructor();
    generateKeyPair(mnemonic: string): Promise<IWalletKeys>;
    generatePublicKey(privateKey: string): Promise<string>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string, amount?: number | null, tokenTypes?: 'native' | 'custom'): Promise<IFee>;
    getTransactionsHistoryByAddress(address: string, page_number?: number, page_size?: number): Promise<ITransactionsData>;
    sendMainToken(data: ISendingTransactionData): Promise<string>;
    send20Token(): Promise<string>;
    private generateTokenObject;
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    private convertTransactionToCommonFormat;
}
//# sourceMappingURL=Litecoin.service.d.ts.map