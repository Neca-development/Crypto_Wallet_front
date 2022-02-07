import { Wallet } from './wallet';
import { ChainIds } from './models/enums';
import { ICreateWalletsData } from './models/wallet';
export declare class WalletFactory {
    wallets: Wallet[];
    /**
     * Create a single wallet for every chain
     * @desc set menmonic to restore wallet. By default generate new menmonic. If mnemonic were passed, method restore existing wallets
     * @param {string} mnemonic
     * @returns {Promise<Wallet[]>}
     */
    createWallets(mnemonic?: string, chainId?: ChainIds): Promise<ICreateWalletsData>;
    /**
     * @desc Create a single Tron wallet
     * @param {string} privateKey:string
     * @returns {Promise<Wallet>}
     */
    createWalletByPrivateKey(privateKey: string, chainId: ChainIds): Promise<Wallet>;
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
    getAllTokens(): Promise<any>;
}
//# sourceMappingURL=wallet-factory.d.ts.map