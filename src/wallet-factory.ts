import { Wallet } from './wallet';
// @ts-ignore
import hdWallet from 'tron-wallet-hd';
import { ChainIds } from './models/enums';
import { ICreateWalletsData } from './models/wallet';

export class WalletFactory {
  /**
   * Create a single wallet for every chain
   * @desc set menmonic to restore wallet. By default generate new menmonic. If mnemonic were passed, method restore existing wallets
   * @param {string} mnemonic
   * @returns {Promise<Wallet[]>}
   */
  async createWallets(mnemonic?: string, chainId?: ChainIds): Promise<ICreateWalletsData> {
    if (mnemonic !== undefined && mnemonic !== null && hdWallet.validateMnemonic(mnemonic) === false) {
      throw new Error('Invalid mnemonic seed provided!');
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

    return { mnemonic, wallets };
  }

  /**
   * @desc Create a single Tron wallet
   * @param {string} privateKey:string
   * @returns {Promise<Wallet>}
   */
  async createTronWallet(privateKey: string): Promise<Wallet> {
    const tronWallet = new Wallet(ChainIds.Tron, null, privateKey);
    await tronWallet.init();
    return tronWallet;
  }
}
