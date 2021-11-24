import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { IToken } from '../models/token';
export declare class ethereumService implements IChainService {
    private web3;
    constructor();
    createWallet(mnemonic: string): Promise<IWalletKeys>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string): Promise<IFee>;
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
    sendMainToken(data: ISendingTransactionData): Promise<void>;
    send20Token(data: ISendingTransactionData): Promise<void>;
    getTokenContractAddress(tokens: any[], tokenAbbr: string): any;
    /**
     * @param {string} address:string
     * @param {number} ethToUSD:number
     * @returns {Promise<ITransaction[]>}
     */
    private getNormalTransactions;
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
//# sourceMappingURL=Ethereum.service.d.ts.map