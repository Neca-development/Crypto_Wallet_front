import { Wallet } from '../wallet';
import { ChainIds } from './enums';
import { IToken } from './token';
export interface IWalletData {
    privateKey: string;
    publicKey: string;
    mnemonic: string;
    chainId: ChainIds;
    tokens: IToken[];
}
export interface IWalletKeys {
    privateKey: string;
    publicKey: string;
}
export interface ICreateWalletsData {
    mnemonic: string;
    wallets: Array<Wallet>;
}
//# sourceMappingURL=wallet.d.ts.map