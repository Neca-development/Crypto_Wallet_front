import { ChainIds } from "./models/enums";
import { IWallet, IWalletData, IWalletFabric } from "./models/wallet";
import { tronService } from "./services/Tron.servicce";
import hdWallet from "tron-wallet-hd";
import { IChainService } from "./models/chainService";

export class WalletFabric implements IWalletFabric {
  createWallets() {
    const wallets: IWallet[] = [];
    const mnemonic = hdWallet.generateMnemonic();

    for (const chainId in ChainIds) {
      const isValueProperty = parseInt(chainId, 10) >= 0;

      if (isValueProperty) {
        wallets.push(new Wallet(chainId as unknown as ChainIds, mnemonic));
      }
    }

    return wallets;
  }
}

class Wallet implements IWallet {
  data: IWalletData = {
    privateKey: null,
    publicKey: null,
    chainId: null,
    mnemonic: null,
  };

  service: IChainService;

  constructor(chainId: ChainIds, mnemonic: string) {
    this.data.chainId = chainId;
    this.data.mnemonic = mnemonic;

    this.selectChainService(chainId);
    this.createWallet();
  }

  private selectChainService(chainId: ChainIds) {
    switch (+chainId) {
      case ChainIds["Ethereum"]:
        console.log("Ether");
        break;
      case ChainIds["Tron"]:
        console.log("Tron");
        this.service = new tronService();
        break;

      default:
        break;
    }
  }

  private async createWallet() {
    const data = await this.service.createWallet(this.data.mnemonic);
    this.data.privateKey = data.privateKey;
    this.data.publicKey = data.publicKey;

    console.log(this.data);
  }
}
