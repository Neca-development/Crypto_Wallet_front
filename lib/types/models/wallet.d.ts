import { ChainIds } from "./enums";
export interface IWalletFabric {
    createWallets(): IWallet[];
}
export interface IWallet {
    data: IWalletData;
}
export interface IWalletData {
    privateKey: string;
    publicKey: string;
    mnemonic: string;
    chainId: ChainIds;
}
export interface IWalletKeys {
    privateKey: string;
    publicKey: string;
}
//# sourceMappingURL=wallet.d.ts.map