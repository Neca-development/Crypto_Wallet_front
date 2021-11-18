import { ISendingTransactionData, ITransaction } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";
import { IToken } from "../models/token";
export declare class tronService implements IChainService {
    Tron: any;
    constructor();
    createWallet(mnemonic: string): Promise<IWalletKeys>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
    sendMainToken(data: ISendingTransactionData): Promise<void>;
    send20Token(data: ISendingTransactionData): Promise<void>;
    getTokenContractAddress(tokens: any[], tokenAbbr: string): any;
}
//# sourceMappingURL=Tron.service.d.ts.map