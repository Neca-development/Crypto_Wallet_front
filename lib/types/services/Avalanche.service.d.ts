import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { IToken } from '../models/token';
export declare class avalancheService implements IChainService {
    private xchain;
    private keys;
    private networkConfog;
    private avaxAssetId;
    constructor();
    generateKeyPair(mnemonic: string): Promise<IWalletKeys>;
    generatePublicKey(privateKey: string): Promise<string>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string): Promise<IFee>;
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
    sendMainToken(data: ISendingTransactionData): Promise<string>;
    send20Token(data: ISendingTransactionData): Promise<string>;
    private generateTokenObject;
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    private convertTransactionToCommonFormat;
}
//# sourceMappingURL=Avalanche.service.d.ts.map