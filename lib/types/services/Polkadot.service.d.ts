import { IFee, ISendingTransactionData } from '../models/transaction';
import { IWalletKeys } from '../models/wallet';
import { IChainService } from '../models/chainService';
import { ITransaction } from '../models/transaction';
import { IToken } from '../models/token';
export declare class polkadotService implements IChainService {
    private _provider;
    private _api;
    private _publicKey;
    private _keyring;
    private web3;
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
//# sourceMappingURL=Polkadot.service.d.ts.map