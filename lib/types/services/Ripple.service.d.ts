import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { IToken } from '../models/token';
export declare class rippleService implements IChainService {
    private keys;
    private wallet;
    private xrplClient;
    private connectionPending;
    constructor();
    init(): Promise<void>;
    generateKeyPair(mnemonic: string): Promise<IWalletKeys>;
    generatePublicKey(privateKey: string): Promise<string>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string, amount?: number | null, tokenTypes?: 'native' | 'custom'): Promise<IFee>;
    getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
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
    private checkConnection;
}
//# sourceMappingURL=Ripple.service.d.ts.map