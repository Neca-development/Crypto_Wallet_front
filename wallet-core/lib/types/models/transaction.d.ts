export interface ISendingTransactionData {
    privateKey: string;
    receiverAddress: string;
    amount: number;
    cotractAddress?: string;
}
