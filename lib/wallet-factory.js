"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletFactory = void 0;
const wallet_1 = require("./wallet");
// @ts-ignore
const enums_1 = require("./models/enums");
const errors_1 = require("./errors");
require('buffer');
const buffer_1 = require("buffer");
const bip39 = __importStar(require("bip39"));
class WalletFactory {
    constructor() {
        this.wallets = [];
    }
    /**
     * Create a single wallet for every chain
     * @desc set menmonic to restore wallet. By default generate new menmonic. If mnemonic were passed, method restore existing wallets
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    async createWallets(mnemonic, chainId) {
        // @ts-ignore
        window.Buffer = buffer_1.Buffer;
        console.log(buffer_1.Buffer);
        // @ts-ignore
        console.log(window.Buffer);
        if (mnemonic !== undefined && mnemonic !== null && bip39.validateMnemonic(mnemonic) === false) {
            throw new errors_1.CustomError('Invalid seed phrase was provided', 0, enums_1.ErrorsTypes['Invalid data']);
        }
        if (mnemonic === undefined || mnemonic === null) {
            mnemonic = bip39.generateMnemonic();
        }
        if (chainId !== undefined && chainId !== null) {
            const wallet = new wallet_1.Wallet(chainId, mnemonic);
            return { mnemonic, wallets: [wallet] };
        }
        const wallets = [];
        for (const id in enums_1.ChainIds) {
            const isValueProperty = parseInt(id, 10) >= 0;
            if (isValueProperty) {
                wallets.push(new wallet_1.Wallet(id, mnemonic));
            }
        }
        for (const wallet of wallets) {
            await wallet.init();
        }
        this.wallets = wallets;
        return { mnemonic, wallets };
    }
    /**
     * @desc Create a single Tron wallet
     * @param {string} privateKey:string
     * @returns {Promise<Wallet>}
     */
    async createWalletByPrivateKey(privateKey, chainId) {
        const wallet = new wallet_1.Wallet(enums_1.ChainIds[chainId], null, privateKey);
        await wallet.init();
        this.wallets.push(wallet);
        return wallet;
    }
    /**
     * @desc return all tokens supported by library with balance
     * @return
     * ```typescript
     * Example of response
     *
     * {
            "Tron": {
                "tokens": [
                    {
                        "standard": null,
                        "balance": "0.79176",
                        "balanceInUSD": 0.04,
                        "tokenName": "TRX",
                        "tokenType": "native",
                        "tokenPriceInUSD": 0.06,
                        "tokenLogo": "https://wallet-api.sawe.dev/api/images/TRX.svg"
                    },
                    {
                        "standard": "TRC 20",
                        "balance": 0,
                        "balanceInUSD": 0,
                        "contractAddress": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
                        "tokenName": "Tether USDT",
                        "tokenType": "custom",
                        "tokenPriceInUSD": 1,
                        "tokenLogo": "https://wallet-api.sawe.dev/api/images/USDT.svg"
                    }
                ],
                "totalBalanceInUSD": 0.04
            },
            "Ethereum": {
                "tokens": [
                    {
                        "standard": null,
                        "balance": 11.318708173683875,
                        "balanceInUSD": 34750.81,
                        "tokenName": "ETH",
                        "tokenType": "native",
                        "tokenPriceInUSD": 3070.21,
                        "tokenLogo": "https://wallet-api.sawe.dev/api/images/ETH.svg"
                    },
                    {
                        "standard": "ERC 20",
                        "balance": 35.979,
                        "balanceInUSD": 35.97,
                        "contractAddress": "0xd92e713d051c37ebb2561803a3b5fbabc4962431",
                        "tokenName": "Tether USDT",
                        "tokenType": "custom",
                        "tokenPriceInUSD": 1,
                        "tokenLogo": "https://wallet-api.sawe.dev/api/images/USDT.svg"
                    }
                ],
                "totalBalanceInUSD": 34786.78
            },
            "EthereumClassic": {
                "tokens": [
                    {
                        "balance": 0,
                        "balanceInUSD": 0,
                        "tokenName": "ETC",
                        "tokenType": "native",
                        "tokenPriceInUSD": 31.34,
                        "tokenLogo": "https://wallet-api.sawe.dev/api/images/ETC.svg"
                    }
                ],
                "totalBalanceInUSD": 0
            },
        }
      ```
     */
    async getAllTokens() {
        const tokens = {};
        await Promise.all(this.wallets.map((wallet) => {
            return new Promise(async (resolve) => {
                tokens[wallet.chainId] = await wallet.getTokensByAddress();
                resolve();
            });
        }));
        return tokens;
    }
}
exports.WalletFactory = WalletFactory;
//# sourceMappingURL=wallet-factory.js.map