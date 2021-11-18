var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Wallet } from "./wallet";
// @ts-ignore
import hdWallet from "tron-wallet-hd";
import { ChainIds } from "./models/enums";
export class WalletFactory {
    /**
     * Create a single wallet for every chain
     * set menmonic to restore wallet. By default generate new menmonic
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    createWallets(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mnemonic === undefined) {
                mnemonic = hdWallet.generateMnemonic();
            }
            console.log("%cMyProject%cline:15%cmnemonic", "color:#fff;background:#ee6f57;padding:3px;border-radius:2px", "color:#fff;background:#1f3c88;padding:3px;border-radius:2px", "color:#fff;background:rgb(251, 178, 23);padding:3px;border-radius:2px", mnemonic);
            const wallets = [];
            for (const chainId in ChainIds) {
                const isValueProperty = parseInt(chainId, 10) >= 0;
                if (isValueProperty) {
                    wallets.push(new Wallet(chainId, mnemonic));
                }
            }
            for (const wallet of wallets) {
                yield wallet.init();
            }
            return wallets;
        });
    }
}
//# sourceMappingURL=wallet-factory.js.map