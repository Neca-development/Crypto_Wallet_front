export interface ISendingTransactionData {
  privateKey: string;
  receiverAddress: string;
  amount: number;
  cotractAddress?: string;
}

export interface ITransaction {
  amount: number;
  amountInUSD: number;
  to: string;
  from: string;
  direction: "IN" | "OUT";
  txId: string;
  tokenName: string;
  timestamp: number;
  status?: "CONFIRMED" | "UNCOMFIRMED";
  type?: "TransferContract" | "TriggerSmartContract";
}
