import { IFee, ISendingTransactionData, ITransaction } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";
import { IToken } from "../models/token";
export declare class tronService implements IChainService {
    Tron: any;
    constructor();
    createWallet(mnemonic: string): Promise<IWalletKeys>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(): Promise<IFee>;
    getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
    sendMainToken(data: ISendingTransactionData): Promise<void>;
    send20Token(data: ISendingTransactionData): Promise<void>;
    /**
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {Promise<ITransaction[]>}
     */
    private getTrxTransactions;
    /**
     * @param {string} address:string
     * @returns {Promise<ITransaction[]>}
     */
    private getUSDTTransactions;
    /**
     * 描述
     * @date 2021-11-20
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    private convertTransactionToCommonFormat;
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    private convertUSDTTransactionToCommonFormat;
}
//# sourceMappingURL=Tron.service.d.ts.map