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
import { bitcoinService } from './services/Bitcoin.service';
import { CustomError } from './errors';
import { solanaService } from './services/Solana.service';
import { polygonService } from './services/Polygon.service';
import { litecoinService } from './services/Litecoin.service';
import { ethereumClassicService } from './services/EthereumClassic.service';
import { bitcoincashService } from './services/Bitcoincash.service';
import { dogecoinService } from './services/Dogecoin.service';
import { dashService } from './services/Dash.service';
import { zcashService } from './services/Zcash.service';
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
     * Return tokens by wallet address
     * @returns {Promise<IToken[]>}
     */
    getTokensByAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokens = yield this.service.getTokensByAddress(this.data.publicKey);
                let totalBalanceInUSD = tokens.reduce((balance, x) => balance + x.balanceInUSD, 0);
                totalBalanceInUSD = Math.trunc(totalBalanceInUSD * 100) / 100;
                return { tokens, totalBalanceInUSD };
            }
            catch (error) {
                throw new CustomError(`An error occurred while receiving wallet tokens info from ${this.chainId} network`, 3, ErrorsTypes['Network error'], error);
            }
        });
    }
    /**
     * Return wallet transactions
     * @returns {Promise<ITransaction[]>}
     */
    getTransactionsHistoryByAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.service.getTransactionsHistoryByAddress(this.data.publicKey);
            }
            catch (error) {
                console.error(error);
                throw new CustomError(`An error occurred while receiving wallet transactions history info from ${this.chainId} network`, 5, ErrorsTypes['Network error'], error);
            }
        });
    }
    /**
     * Returns the current fee price oracle.
     * @param {string} receiverAddress
     * @returns {Promise<IFee>}
     */
    getFeePriceOracle(receiverAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.service.getFeePriceOracle(this.data.publicKey, receiverAddress);
            }
            catch (error) {
                throw new CustomError(`An error occurred while calculating transaction fee price for ${this.chainId} network`, 6, ErrorsTypes['Network error'], error);
            }
        });
    }
    /**
     * send current chain main token e.g. ETH, BTC or TRX. Retutn transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(data);
            if (data.amount == null) {
                throw new CustomError(`You have not passed the amount of native tokens to send`, 7, ErrorsTypes['Insufficient data']);
            }
            if (data.receiverAddress == null || data.receiverAddress.trim() === '') {
                throw new CustomError(`You have not passed receiver address`, 8, ErrorsTypes['Insufficient data']);
            }
            try {
                return yield this.service.sendMainToken(data);
            }
            catch (error) {
                console.log(error);
                throw new CustomError(`An error occurred while sending native tokens in ${this.chainId} network`, 9, ErrorsTypes['Network error'], error);
            }
        });
    }
    /**
     * send 20 token e.g. ERC-20 or TRC-20. Return transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<string>}
     */
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data.amount == null) {
                throw new CustomError(`You have not passed the amount of custom tokens to send`, 10, ErrorsTypes['Insufficient data']);
            }
            if (data.receiverAddress == null || data.receiverAddress.trim() === '') {
                throw new CustomError(`You have not passed receiver address`, 11, ErrorsTypes['Insufficient data']);
            }
            if (data.cotractAddress == null || data.cotractAddress.trim() === '') {
                throw new CustomError(`You have not passed contract address of custom token`, 12, ErrorsTypes['Insufficient data']);
            }
            try {
                return yield this.service.send20Token(Object.assign(Object.assign({}, data), { privateKey: this.data.privateKey }));
            }
            catch (error) {
                throw new CustomError(`An error occurred while sending custom tokens in ${this.chainId} network`, 13, ErrorsTypes['Network error'], error);
            }
        });
    }
    /**
     * select chain service for wallet
     * @param {chainId} chainId:ChainIds
     * @returns {void}
     */
    selectChainService(chainId) {
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
                case ChainIds['Solana']:
                    this.service = new solanaService();
                    break;
                case ChainIds['Bitcoin']:
                    this.service = new bitcoinService();
                    break;
                case ChainIds['Polygon']:
                    this.service = new polygonService();
                    break;
                case ChainIds['Litecoin']:
                    this.service = new litecoinService();
                    break;
                case ChainIds['EthereumClassic']:
                    this.service = new ethereumClassicService();
                    break;
                case ChainIds['Bitcoincash']:
                    this.service = new bitcoincashService();
                    break;
                case ChainIds['Dogecoin']:
                    this.service = new dogecoinService();
                    break;
                case ChainIds['Dash']:
                    this.service = new dashService();
                    break;
                case ChainIds['Zcash']:
                    this.service = new zcashService();
                    break;
                default:
                    break;
            }
        }
        catch (error) {
            throw new CustomError(`An error occurred while generating keys for ${this.chainId}`, 2, ErrorsTypes['Unknown error'], error);
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
                console.log(error);
                throw new CustomError(`An error occurred while generating keys for ${this.chainId}`, 1, ErrorsTypes['Unknown error'], error);
            }
        });
    }
}
//# sourceMappingURL=wallet.js.map