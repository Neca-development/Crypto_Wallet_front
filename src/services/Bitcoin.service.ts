import { IChainService, ISendingTransactionData, IToken, ITransaction } from "../main";
import { IFee } from "../models/transaction";
// @ts-ignore
import bitcore from 'bitcore-lib'
// @ts-ignore
import CoinKey from 'coinkey'

export class bitcoinService implements IChainService {
  private mnemonic: string;

  generateKeyPair(mnemonic: string) {
    this.mnemonic = mnemonic

    let value = Buffer.from(mnemonic)
    let hash = bitcore.crypto.Hash.sha256(value)
    const bn = bitcore.crypto.BN.fromBuffer(hash)

    // const wif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';

    const privateKey = new bitcore.PrivateKey(bn)
    const address = new bitcore.PrivateKey(bn).toAddress()

    // var privateKey = new bitcore.PrivateKey();
    // var address = privateKey.toAddress();

    // var ck = CoinKey.fromWif(wif)

    return {
      privateKey: privateKey,
      publicKey: address,
    };
    // throw new Error("Method not implemented.");
  }

  generatePublicKey(): Promise<string> {
    let value = Buffer.from(this.mnemonic)
    let hash = bitcore.crypto.Hash.sha256(value)
    const bn = bitcore.crypto.BN.fromBuffer(hash)
    const address = new bitcore.PrivateKey(bn).toAddress()
    return address
    // throw new Error("Method not implemented.");
  }
  getTokensByAddress(): Promise<IToken[]> {
    throw new Error("Method not implemented.");
  }
  getTransactionsHistoryByAddress(): Promise<ITransaction[]> {
    throw new Error("Method not implemented.");
  }
  getFeePriceOracle(): Promise<IFee> {
    throw new Error("Method not implemented.");
  }
  sendMainToken(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  send20Token(): Promise<string> {
    throw new Error("Method not implemented.");
  }

}