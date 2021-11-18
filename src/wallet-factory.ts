import { Wallet } from "./wallet";
// @ts-ignore
import hdWallet from "tron-wallet-hd";
import { ChainIds } from "./models/enums";

export class WalletFactory {
  /**
   * Create a single wallet for every chain
   * set menmonic to restore wallet. By default generate new menmonic
   * @param {string} mnemonic
   * @returns {Promise<Wallet[]>}
   */
  async createWallets(mnemonic?: string): Promise<Wallet[]> {
    if (mnemonic === undefined) {
      mnemonic = hdWallet.generateMnemonic();
    }
    console.log(
      "%cMyProject%cline:15%cmnemonic",
      "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
      "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
      "color:#fff;background:rgb(251, 178, 23);padding:3px;border-radius:2px",
      mnemonic
    );

    const wallets: Wallet[] = [];

    for (const chainId in ChainIds) {
      const isValueProperty = parseInt(chainId, 10) >= 0;

      if (isValueProperty) {
        wallets.push(new Wallet(chainId as unknown as ChainIds, mnemonic));
      }
    }

    for (const wallet of wallets) {
      await wallet.init();
    }

    return wallets;
  }
}
