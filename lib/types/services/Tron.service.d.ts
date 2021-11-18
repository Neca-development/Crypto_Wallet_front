import { ISendingTransactionData } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";
export declare class tronService implements IChainService {
    Tron: any;
    constructor();
    createWallet(mnemonic: string): Promise<IWalletKeys>;
    getWalletTokens(address: string): Promise<any>;
    getTransactions(address: string): Promise<any[]>;
    sendTrx(data: ISendingTransactionData): Promise<void>;
    sendTRC20Token(data: ISendingTransactionData): Promise<void>;
    getTokenContractAddress(tokens: any[], tokenAbbr: string): any;
}
//# sourceMappingURL=Tron.service.d.ts.map