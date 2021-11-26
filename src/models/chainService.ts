import { IToken } from './token';
import { IFee, ISendingTransactionData, ITransaction } from './transaction';

export interface IChainService {
  createKeyPair(mnemonic: string): any;
  getTokensByAddress(address: string): Promise<IToken[]>;
  getTransactionsHistoryByAddress(address: string): Promise<ITransaction[]>;
  getFeePriceOracle(from: string, to: string): Promise<IFee>;
  sendMainToken(data: ISendingTransactionData): Promise<void>;
  send20Token(data: ISendingTransactionData): Promise<void>;
}
