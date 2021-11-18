import { IToken } from "./token";
import { ISendingTransactionData, ITransaction } from "./transaction";
export interface IChainService {
    createWallet(mnemonic: string): any;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
    sendMainToken(data: ISendingTransactionData): Promise<void>;
    send20Token(data: ISendingTransactionData): Promise<void>;
}
//# sourceMappingURL=chainService.d.ts.map