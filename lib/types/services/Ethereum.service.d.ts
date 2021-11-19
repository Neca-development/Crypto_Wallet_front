import { ISendingTransactionData } from "../models/transaction";
import { IWalletKeys } from "../models/wallet";
import { IChainService } from "../models/chainService";
import { IToken } from "../models/token";
export declare class ethereumService implements IChainService {
    private web3;
    constructor();
    createWallet(mnemonic: string): Promise<IWalletKeys>;
    getTokensByAddress(address: string): Promise<IToken[]>;
    getTransactionsHistoryByAddress(address: string): Promise<any[]>;
    sendMainToken(data: ISendingTransactionData): Promise<void>;
    send20Token(data: ISendingTransactionData): Promise<void>;
    getTokenContractAddress(tokens: any[], tokenAbbr: string): any;
}
//# sourceMappingURL=Ethereum.service.d.ts.map