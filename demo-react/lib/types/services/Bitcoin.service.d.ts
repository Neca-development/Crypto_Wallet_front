import { IChainService, IToken, ITransaction } from "../main";
import { IFee } from "../models/transaction";
export declare class bitcoinService implements IChainService {
    private mnemonic;
    generateKeyPair(mnemonic: string): {
        privateKey: any;
        publicKey: any;
    };
    generatePublicKey(): Promise<string>;
    getTokensByAddress(): Promise<IToken[]>;
    getTransactionsHistoryByAddress(): Promise<ITransaction[]>;
    getFeePriceOracle(): Promise<IFee>;
    sendMainToken(): Promise<string>;
    send20Token(): Promise<string>;
}
//# sourceMappingURL=Bitcoin.service.d.ts.map