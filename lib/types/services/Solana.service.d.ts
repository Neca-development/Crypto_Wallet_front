import { IChainService, ISendingTransactionData, IToken, ITransaction } from "../main";
import { IFee } from "../models/transaction";
import * as solanaWeb3 from '@solana/web3.js';
export declare class solanaService implements IChainService {
    private address;
    private connection;
    constructor();
    generateKeyPair(mnemonic: string): {
        privateKey: string;
        publicKey: solanaWeb3.PublicKey;
    };
    generatePublicKey(privateKey: string): Promise<string>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getFeePriceOracle(from: string, to: string): Promise<IFee>;
    sendMainToken(data: ISendingTransactionData): Promise<string>;
    send20Token(data: ISendingTransactionData): Promise<string>;
    getTransactionsHistoryByAddress(address: any): Promise<ITransaction[]>;
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