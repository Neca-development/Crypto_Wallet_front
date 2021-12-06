var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Wallet } from './wallet';
// @ts-ignore
import hdWallet from 'tron-wallet-hd';
import { ChainIds } from './models/enums';
export class WalletFactory {
    /**
     * Create a single wallet for every chain
     * @desc set menmonic to restore wallet. By default generate new menmonic. If mnemonic were passed, method restore existing wallets
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    createWallets(mnemonic, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mnemonic !== undefined && mnemonic !== null && hdWallet.validateMnemonic(mnemonic) === false) {
                throw new Error('Invalid mnemonic seed provided!');
            }
            if (mnemonic === undefined || mnemonic === null) {
                mnemonic = hdWallet.generateMnemonic();
            }
            if (chainId !== undefined && chainId !== null) {
                const wallet = new Wallet(chainId, mnemonic);
                return { mnemonic, wallets: [wallet] };
            }
            const wallets = [];
            for (const id in ChainIds) {
                const isValueProperty = parseInt(id, 10) >= 0;
                if (isValueProperty) {
                    wallets.push(new Wallet(id, mnemonic));
                }
            }
            for (const wallet of wallets) {
                yield wallet.init();
            }
            return { mnemonic, wallets };
        });
    }
    /**
     * @desc Create a single Tron wallet
     * @param {string} privateKey:string
     * @returns {Promise<Wallet>}
     */
    createTronWallet(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const tronWallet = new Wallet(ChainIds.Tron, null, privateKey);
            yield tronWallet.init();
            return tronWallet;
        });
    }
}
//# sourceMappingURL=wallet-factory.js.map