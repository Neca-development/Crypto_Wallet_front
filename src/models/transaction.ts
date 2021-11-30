export interface ISendingTransactionData {
  /**
   * @desc is inserted automatically from the wallet instance, you do not need to transfer it manually
   */
  privateKey?: string;
  receiverAddress: string;
  amount: number;
  /**
   * @desc take fee in main chain token
   */
  cotractAddress?: string;
}

export interface ITransaction {
  amount: string;
  amountInUSD: string;
  to: string;
  from: string;
  direction: 'IN' | 'OUT';
  txId: string;
  tokenName: string;
  timestamp: number;
  status?: 'CONFIRMED' | 'UNCOMFIRMED';
  type?: 'TransferContract' | 'TriggerSmartContract';
  fee: number;
}

export interface IFee {
  value: string;
  usd: string;
}
