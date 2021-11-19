import { ICreateWalletsData } from "./models/wallet";
export declare class WalletFactory {
    /**
     * Create a single wallet for every chain
     * set menmonic to restore wallet. By default generate new menmonic
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    createWallets(mnemonic?: string): Promise<ICreateWalletsData>;
}
//# sourceMappingURL=wallet-factory.d.ts.map