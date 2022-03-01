import { IToken } from './token';
import { IFee, ISendingTransactionData, ITransaction } from './transaction';

export interface IChainService {
  generateKeyPair(mnemonic: string): any;
  generatePublicKey(privateKey: string): Promise<string>;
  getTokensByAddress(address: string): Promise<IToken[]>;
  getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
  getFeePriceOracle(
    from: string,
    to: string,
    amount: number,
    tokenType: 'native' | 'custom',
    speed: 'slow' | 'medium' | 'fast'
  ): Promise<IFee>;
  sendMainToken(data: ISendingTransactionData): Promise<string>;
  send20Token(data: ISendingTransactionData): Promise<string>;
}
