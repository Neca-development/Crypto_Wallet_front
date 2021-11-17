import { IWalletData } from "./wallet";

export interface IChainService<T> {
  createWallet(mnemonic: string): T;
}
