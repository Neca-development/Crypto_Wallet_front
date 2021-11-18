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
import { ethereumService } from "./services/Ethereum.service";
export class Wallet {
    constructor(chainId, mnemonic) {
        this.isInitialized = false;
        this.data = {
            privateKey: null,
            publicKey: null,
            chainId: null,
            mnemonic: null,
        };
        this.data.chainId = chainId;
        this.data.mnemonic = mnemonic;
        this.selectChainService(chainId);
    }
    /**
     * return wallet chain name
     * @returns {string}
     */
    get chainName() {
        return ChainIds[+this.data.chainId];
    }
    /**
     * return wallet address
     * @returns {string}
     */
    get address() {
        return this.data.publicKey;
    }
    /**
     * return wallet private key
     * @returns {string}
     */
    get privateKey() {
        return this.data.privateKey;
    }
    /**
     * return wallet mnemonic phrase
     * @returns {string}
     */
    get mnemonic() {
        return this.data.mnemonic;
    }
    /**
     * return wallet initialize status
     * @returns {boolean}
     */
    get isWalletInitialized() {
        return this.isInitialized;
    }
    /**
     * generate wallet keys
     * @returns {Promise<void>}
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createKeys();
            this.isInitialized = true;
        });
    }
    /**
     * Return tokens by received address. By default address is current wallet address
     * @param {any} address?:string
     * @returns {Promise<IToken[]>}
     */
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.getTokensByAddress(address || this.data.publicKey);
        });
    }
    /**
     * Return transactions by received address. By default address is current wallet address
     * @param {any} address?:string
     * @returns {Promise<ITransaction[]>}
     */
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.getTransactionsHistoryByAddress(address || this.data.publicKey);
        });
    }
    /**
     * send current chain main token e.g. ETH, BTC or TRX
     * @param {any} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.sendMainToken(data);
        });
    }
    /**
     * send 20 token e.g. ERC-20 or TRC-20
     * @param {any} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.send20Token(data);
        });
    }
    /**
     * select chain service for wallet
     * @param {any} chainId:ChainIds
     * @returns {void}
     */
    selectChainService(chainId) {
        switch (+chainId) {
            case ChainIds["Ethereum"]:
                console.log("Ether");
                this.service = new ethereumService();
                break;
            case ChainIds["Tron"]:
                console.log("Tron");
                this.service = new tronService();
                break;
            default:
                break;
        }
    }
    /**
     * set main wallet data like address and private key
     */
    createKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.service.createWallet(this.data.mnemonic);
            this.data.privateKey = data.privateKey;
            this.data.publicKey = data.publicKey;
        });
    }
}
//# sourceMappingURL=wallet.js.map