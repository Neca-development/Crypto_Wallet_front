import { ISendingTransactionData } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";
export declare class ethereumService implements IChainService {
    web3: any;
    constructor();
    createWallet(mnemonic: string): Promise<IWalletKeys>;
    getTokensByAddress(address: string): Promise<any>;
    getTransactionsHistoryByAddress(address: string): Promise<any[]>;
    sendMainToken(data: ISendingTransactionData): Promise<void>;
    send20Token(data: ISendingTransactionData): Promise<void>;
    getTokenContractAddress(tokens: any[], tokenAbbr: string): any;
}
//# sourceMappingURL=Ethereum.service.d.ts.map