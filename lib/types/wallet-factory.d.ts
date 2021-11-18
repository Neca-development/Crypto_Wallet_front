import { Wallet } from "./wallet";
export declare class WalletFactory {
    /**
     * Create a single wallet for every chain
     * set menmonic to restore wallet. By default generate new menmonic
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    createWallets(mnemonic?: string): Promise<Wallet[]>;
}
//# sourceMappingURL=wallet-factory.d.ts.map