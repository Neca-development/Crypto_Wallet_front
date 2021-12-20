var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ChainIds, ErrorsTypes } from './models/enums';
import { tronService } from './services/Tron.service';
import { ethereumService } from './services/Ethereum.service';
import { binanceService } from './services/Binance.service';
<<<<<<< HEAD
import { CustomError } from './errors';
=======
import { solanaService } from './services/Solana.service';
>>>>>>> origin/master
export class Wallet {
    constructor(chainId, mnemonic, privateKey) {
        this.isInitialized = false;
        this.data = {
            privateKey: null,
            publicKey: null,
            chainId: null,
            mnemonic: null,
        };
        this.data.chainId = chainId;
        this.data.mnemonic = mnemonic;
        if (privateKey) {
            this.data.privateKey = privateKey;
        }
        this.selectChainService(chainId);
    }
    /**
     * return wallet chain id
     * @returns {string}
     */
    get chainId() {
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
     * return total wallet balance in USD
     * @returns {number}
     */
    getTotalBalanceInUSD() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokens = yield this.getTokensByAddress();
                const balance = tokens.reduce((balance, x) => balance + x.balanceInUSD, 0);
                return Math.trunc(balance * 100) / 100;
            }
            catch (error) {
                throw new CustomError(`An error occurred while receiving balance info from ${this.chainId} network`, 0, ErrorsTypes['Unknown error'], error);
            }
        });
    }
    /**
     * Return tokens by wallet address
     * @returns {Promise<IToken[]>}
     */
    getTokensByAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.getTokensByAddress(this.data.publicKey);
        });
    }
    /**
     * Return wallet transactions
     * @returns {Promise<ITransaction[]>}
     */
    getTransactionsHistoryByAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.getTransactionsHistoryByAddress(this.data.publicKey);
        });
    }
    /**
     * Returns the current fee price oracle.
     * @param {string} receiverAddress
     * @returns {Promise<IFee>}
     */
    getFeePriceOracle(receiverAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.getFeePriceOracle(this.data.publicKey, receiverAddress);
        });
    }
    /**
     * send current chain main token e.g. ETH, BTC or TRX. Retutn transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.sendMainToken(data);
        });
    }
    /**
     * send 20 token e.g. ERC-20 or TRC-20. Return transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<string>}
     */
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.service.send20Token(Object.assign(Object.assign({}, data), { privateKey: this.data.privateKey }));
        });
    }
    /**
     * select chain service for wallet
     * @param {chainId} chainId:ChainIds
     * @returns {void}
     */
    selectChainService(chainId) {
<<<<<<< HEAD
        try {
            switch (+chainId) {
                case ChainIds['Ethereum']:
                    this.service = new ethereumService();
                    break;
                case ChainIds['Tron']:
                    this.service = new tronService();
                    break;
                case ChainIds['Binance']:
                    this.service = new binanceService();
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            throw new CustomError(`An error occurred while generating keys for ${this.chainId}`, 0, ErrorsTypes['Unknown error'], error);
=======
        switch (+chainId) {
            case ChainIds['Ethereum']:
                this.service = new ethereumService();
                break;
            case ChainIds['Tron']:
                this.service = new tronService();
                break;
            case ChainIds['Binance']:
                this.service = new binanceService();
                break;
            case ChainIds['Solana']:
                this.service = new solanaService();
                break;
            default:
                break;
>>>>>>> origin/master
        }
    }
    /**
     * set main wallet data like address and private key
     */
    createKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.data.privateKey) {
                    const pubKey = yield this.service.generatePublicKey(this.data.privateKey);
                    this.data.publicKey = pubKey;
                    return;
                }
                const data = yield this.service.generateKeyPair(this.data.mnemonic);
                this.data.privateKey = data.privateKey;
                this.data.publicKey = data.publicKey;
            }
            catch (error) {
                throw new CustomError(`An error occurred while generating keys for ${this.chainId}`, 0, ErrorsTypes['Unknown error'], error);
            }
        });
    }
}
//# sourceMappingURL=wallet.js.map