import { Wallet } from './wallet';
// @ts-ignore
import { ChainIds, ErrorsTypes } from './models/enums';
import { CustomError } from './errors';
import * as bip39 from 'bip39';
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
    async createWallets(mnemonic, chainId) {
        console.log({ bip39 });
        if (mnemonic !== undefined && mnemonic !== null && bip39.validateMnemonic(mnemonic) === false) {
            throw new CustomError('Invalid seed phrase was provided', 0, ErrorsTypes['Invalid data']);
        }
        if (mnemonic === undefined || mnemonic === null) {
            mnemonic = bip39.generateMnemonic();
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
        const wallet = new Wallet(ChainIds[chainId], null, privateKey);
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
//# sourceMappingURL=wallet-factory.js.map