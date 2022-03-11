"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const enums_1 = require("./models/enums");
// import { tronService } from './services/Tron.service';
const Ethereum_service_1 = require("./services/Ethereum.service");
const Binance_service_1 = require("./services/Binance.service");
const Bitcoin_service_1 = require("./services/Bitcoin.service");
const errors_1 = require("./errors");
const Solana_service_1 = require("./services/Solana.service");
const Polygon_service_1 = require("./services/Polygon.service");
const Litecoin_service_1 = require("./services/Litecoin.service");
const EthereumClassic_service_1 = require("./services/EthereumClassic.service");
const Bitcoincash_service_1 = require("./services/Bitcoincash.service");
const Dogecoin_service_1 = require("./services/Dogecoin.service");
const Dash_service_1 = require("./services/Dash.service");
const Zcash_service_1 = require("./services/Zcash.service");
const Ripple_service_1 = require("./services/Ripple.service");
const Polkadot_service_1 = require("./services/Polkadot.service");
const Harmony_service_1 = require("./services/Harmony.service");
const Avalanche_service_1 = require("./services/Avalanche.service");
class Wallet {
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
        return enums_1.ChainIds[+this.data.chainId];
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
    async init() {
        await this.createKeys();
        this.isInitialized = true;
    }
    /**
     * Return tokens by wallet address
     * @returns {Promise<IToken[]>}
     */
    async getTokensByAddress() {
        try {
            const tokens = await this.service.getTokensByAddress(this.data.publicKey);
            let totalBalanceInUSD = tokens.reduce((balance, x) => balance + x.balanceInUSD, 0);
            totalBalanceInUSD = Math.trunc(totalBalanceInUSD * 100) / 100;
            return { tokens, totalBalanceInUSD };
        }
        catch (error) {
            throw new errors_1.CustomError(`An error occurred while receiving wallet tokens info from ${this.chainId} network`, 3, enums_1.ErrorsTypes['Network error'], error);
        }
    }
    /**
     * Return wallet transactions
     * @param  {number} pageNumber
     * @param {number} pageSize
     * @returns {Promise<ITransactionsData>}
     */
    async getTransactionsHistoryByAddress(pageNumber, pageSize) {
        try {
            return await this.service.getTransactionsHistoryByAddress(this.data.publicKey, pageNumber, pageSize);
        }
        catch (error) {
            console.error(error);
            throw new errors_1.CustomError(`An error occurred while receiving wallet transactions history info from ${this.chainId} network`, 5, enums_1.ErrorsTypes['Network error'], error);
        }
    }
    /**
     * Returns the current fee price oracle.
     * @param {string} receiverAddress
     * @param {number} amount:number
     * @param {'native'|'custom'} tokenType:by default = 'native'
     * @param {'slow'|'medium'|'fast'} rate:by default = 'medium'
     * @returns {Promise<IFee>}
     */
    async getFeePriceOracle(receiverAddress, amount, tokenType = 'native', rate = 'medium') {
        try {
            return await this.service.getFeePriceOracle(this.data.publicKey, receiverAddress, amount, tokenType, rate);
        }
        catch (error) {
            console.error(error);
            throw new errors_1.CustomError(`An error occurred while calculating transaction fee price for ${this.chainId} network`, 6, enums_1.ErrorsTypes['Network error'], error);
        }
    }
    /**
     * send current chain main token e.g. ETH, BTC or TRX. Retutn transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<void>}
     */
    async sendMainToken(data) {
        console.log(data);
        if (data.amount == null) {
            throw new errors_1.CustomError(`You have not passed the amount of native tokens to send`, 7, enums_1.ErrorsTypes['Insufficient data']);
        }
        if (data.receiverAddress == null || data.receiverAddress.trim() === '') {
            throw new errors_1.CustomError(`You have not passed receiver address`, 8, enums_1.ErrorsTypes['Insufficient data']);
        }
        try {
            return await this.service.sendMainToken(data);
        }
        catch (error) {
            console.log(error);
            throw new errors_1.CustomError(`An error occurred while sending native tokens in ${this.chainId} network`, 9, enums_1.ErrorsTypes['Network error'], error);
        }
    }
    /**
     * send 20 token e.g. ERC-20 or TRC-20. Return transaction hash
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {Promise<string>}
     */
    async send20Token(data) {
        if (data.amount == null) {
            throw new errors_1.CustomError(`You have not passed the amount of custom tokens to send`, 10, enums_1.ErrorsTypes['Insufficient data']);
        }
        if (data.receiverAddress == null || data.receiverAddress.trim() === '') {
            throw new errors_1.CustomError(`You have not passed receiver address`, 11, enums_1.ErrorsTypes['Insufficient data']);
        }
        if (data.cotractAddress == null || data.cotractAddress.trim() === '') {
            throw new errors_1.CustomError(`You have not passed contract address of custom token`, 12, enums_1.ErrorsTypes['Insufficient data']);
        }
        try {
            return await this.service.send20Token(Object.assign(Object.assign({}, data), { privateKey: this.data.privateKey }));
        }
        catch (error) {
            throw new errors_1.CustomError(`An error occurred while sending custom tokens in ${this.chainId} network`, 13, enums_1.ErrorsTypes['Network error'], error);
        }
    }
    /**
     * select chain service for wallet
     * @param {chainId} chainId:ChainIds
     * @returns {void}
     */
    selectChainService(chainId) {
        try {
            switch (+chainId) {
                case enums_1.ChainIds['Ethereum']:
                    this.service = new Ethereum_service_1.ethereumService();
                    break;
                // case ChainIds['Tron']:
                //   this.service = new tronService();
                //   break;
                case enums_1.ChainIds['Binance']:
                    this.service = new Binance_service_1.binanceService();
                    break;
                case enums_1.ChainIds['Solana']:
                    this.service = new Solana_service_1.solanaService();
                    break;
                case enums_1.ChainIds['Bitcoin']:
                    this.service = new Bitcoin_service_1.bitcoinService();
                    break;
                case enums_1.ChainIds['Polygon']:
                    this.service = new Polygon_service_1.polygonService();
                    break;
                case enums_1.ChainIds['Litecoin']:
                    this.service = new Litecoin_service_1.litecoinService();
                    break;
                case enums_1.ChainIds['EthereumClassic']:
                    this.service = new EthereumClassic_service_1.ethereumClassicService();
                    break;
                case enums_1.ChainIds['Bitcoincash']:
                    this.service = new Bitcoincash_service_1.bitcoincashService();
                    break;
                case enums_1.ChainIds['Dogecoin']:
                    this.service = new Dogecoin_service_1.dogecoinService();
                    break;
                case enums_1.ChainIds['Dash']:
                    this.service = new Dash_service_1.dashService();
                    break;
                case enums_1.ChainIds['Zcash']:
                    this.service = new Zcash_service_1.zcashService();
                    break;
                case enums_1.ChainIds['Ripple']:
                    this.service = new Ripple_service_1.rippleService();
                    break;
                case enums_1.ChainIds['Polkadot']:
                    this.service = new Polkadot_service_1.polkadotService();
                    break;
                case enums_1.ChainIds['Harmony']:
                    this.service = new Harmony_service_1.harmonyService();
                    break;
                case enums_1.ChainIds['Avalanche']:
                    this.service = new Avalanche_service_1.avalancheService();
                    break;
            }
        }
        catch (error) {
            throw new errors_1.CustomError(`An error occurred while generating keys for ${this.chainId}`, 2, enums_1.ErrorsTypes['Unknown error'], error);
        }
    }
    /**
     * set main wallet data like address and private key
     */
    async createKeys() {
        try {
            if (this.data.privateKey) {
                const pubKey = await this.service.generatePublicKey(this.data.privateKey);
                this.data.publicKey = pubKey;
                return;
            }
            const data = await this.service.generateKeyPair(this.data.mnemonic);
            this.data.privateKey = data.privateKey;
            this.data.publicKey = data.publicKey;
        }
        catch (error) {
            console.log(error);
            throw new errors_1.CustomError(`An error occurred while generating keys for ${this.chainId}`, 1, enums_1.ErrorsTypes['Unknown error'], error);
        }
    }
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map