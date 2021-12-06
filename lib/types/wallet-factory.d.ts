import { Wallet } from './wallet';
import { ChainIds } from './models/enums';
import { ICreateWalletsData } from './models/wallet';
export declare class WalletFactory {
    /**
     * Create a single wallet for every chain
     * @desc set menmonic to restore wallet. By default generate new menmonic. If mnemonic were passed, method restore existing wallets
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    createWallets(mnemonic?: string, chainId?: ChainIds): Promise<ICreateWalletsData>;
    /**
     * @desc Create a single Tron wallet
     * @param {string} privateKey:string
     * @returns {Promise<Wallet>}
     */
    createTronWallet(privateKey: string): Promise<Wallet>;
}
//# sourceMappingURL=wallet-factory.d.ts.map