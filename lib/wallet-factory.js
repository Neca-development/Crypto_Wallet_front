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
import { ChainIds, ErrorsTypes } from './models/enums';
import { CustomError } from './errors';
export class WalletFactory {
    constructor() {
        this.wallets = [];
    }
    /**
     * Create a single wallet for every chain
     * @desc set menmonic to restore wallet. By default generate new menmonic. If mnemonic were passed, method restore existing wallets
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    createWallets(mnemonic, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mnemonic !== undefined && mnemonic !== null && hdWallet.validateMnemonic(mnemonic) === false) {
                throw new CustomError('Invalid seed phrase was provided', 0, ErrorsTypes['Invalid data']);
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
            this.wallets = wallets;
            return { mnemonic, wallets };
        });
    }
    /**
     * @desc Create a single Tron wallet
     * @param {string} privateKey:string
     * @returns {Promise<Wallet>}
     */
    createWalletByPrivateKey(privateKey, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tronWallet = new Wallet(ChainIds[chainId], null, privateKey);
            yield tronWallet.init();
            return tronWallet;
        });
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
    getAllTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = {};
            for (const wallet of this.wallets) {
                tokens[wallet.chainId] = yield wallet.getTokensByAddress();
            }
            return tokens;
        });
    }
}
//# sourceMappingURL=wallet-factory.js.map