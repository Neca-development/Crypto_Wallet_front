export interface ISendingTransactionData {
    privateKey: string;
    receiverAddress: string;
    amount: number;
    cotractAddress?: string;
}
export interface ITransaction {
    amount: string;
    to: string;
    from: string;
    costInUSD: string;
    direction: "IN" | "OUT";
    status: "CONFIRMED" | "UNCOMFIRMED";
}
//# sourceMappingURL=transaction.d.ts.map