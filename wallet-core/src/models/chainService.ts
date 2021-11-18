import { IWalletData } from "./wallet";

export interface IChainService {
  createWallet(mnemonic: string): any;
}
