import { Wallet } from './wallet';
// @ts-ignore
import hdWallet from 'tron-wallet-hd';
import { ChainIds, ErrorsTypes } from './models/enums';
import { ICreateWalletsData } from './models/wallet';
import { CustomError } from './errors';
import { MintTokenMsg } from '@binance-chain/javascript-sdk/lib/types';

export class WalletFactory {
  wallets: Wallet[] = [];

  /**
   * Create a single wallet for every chain
   * @desc set menmonic to restore wallet. By default generate new menmonic. If mnemonic were passed, method restore existing wallets
   * @param {string} mnemonic
   * @returns {Promise<Wallet[]>}
   */
  async createWallets(mnemonic?: string, chainId?: ChainIds): Promise<ICreateWalletsData> {
    if (mnemonic !== undefined && mnemonic !== null && hdWallet.validateMnemonic(mnemonic) === false) {
      throw new CustomError('Invalid seed phrase was provided', 0, ErrorsTypes['Invalid data']);
    }

    if (mnemonic === undefined || mnemonic === null) {
      mnemonic = hdWallet.generateMnemonic();
    }

    if (chainId !== undefined && chainId !== null) {
      const wallet = new Wallet(chainId as unknown as ChainIds, mnemonic);
      return { mnemonic, wallets: [wallet] };
    }

    const wallets: Wallet[] = [];

    for (const id in ChainIds) {
      const isValueProperty = parseInt(id, 10) >= 0;

      if (isValueProperty) {
        wallets.push(new Wallet(id as unknown as ChainIds, mnemonic));
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
  async createWalletByPrivateKey(privateKey: string, chainId: ChainIds): Promise<Wallet> {
    const tronWallet = new Wallet(ChainIds[chainId] as unknown as ChainIds, null, privateKey);
    await tronWallet.init();
    return tronWallet;
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
                    "standard": "TRC 20",
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
                    "standard": "ERC 20",
                    "balance": 11.319326790188482,
                    "balanceInUSD": 34818.36,
                    "tokenName": "ETH",
                    "tokenType": "native",
                    "tokenPriceInUSD": 3076.01,
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
            "totalBalanceInUSD": 34854.33
        },
        "EthereumClassic": {
            "tokens": [
                {
                    "balance": 0,
                    "balanceInUSD": 0,
                    "tokenName": "ETC",
                    "tokenType": "native",
                    "tokenPriceInUSD": 31.42,
                    "tokenLogo": "https://wallet-api.sawe.dev/api/images/ETC.svg"
                }
            ],
            "totalBalanceInUSD": 0
        },
    }
    ```
   */
  async getAllTokens(): Promise<any> {
    const tokens = {};

    for (const wallet of this.wallets) {
      tokens[wallet.chainId] = await wallet.getTokensByAddress();
    }

    return tokens;
  }
}
