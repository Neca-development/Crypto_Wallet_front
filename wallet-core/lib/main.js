var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ChainIds } from "./models/enums";
import { tronService } from "./services/Tron.service";
// @ts-ignore
import hdWallet from "../node_modules/tron-wallet-hd";
export class WalletFabric {
    createWallets() {
        const wallets = [];
        const mnemonic = hdWallet.generateMnemonic();
        for (const chainId in ChainIds) {
            const isValueProperty = parseInt(chainId, 10) >= 0;
            if (isValueProperty) {
                wallets.push(new Wallet(chainId, mnemonic));
            }
        }
        return wallets;
    }
}
class Wallet {
    constructor(chainId, mnemonic) {
        this.data = {
            privateKey: null,
            publicKey: null,
            chainId: null,
            mnemonic: null,
        };
        this.data.chainId = chainId;
        this.data.mnemonic = mnemonic;
        this.selectChainService(chainId);
        this.createWallet();
    }
    selectChainService(chainId) {
        switch (+chainId) {
            case ChainIds["Ethereum"]:
                console.log("Ether");
                break;
            case ChainIds["Tron"]:
                console.log("Tron");
                this.service = new tronService();
                break;
            default:
                break;
        }
    }
    createWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.service.createWallet(this.data.mnemonic);
            this.data.privateKey = data.privateKey;
            this.data.publicKey = data.publicKey;
            console.log(this.data);
        });
    }
}
