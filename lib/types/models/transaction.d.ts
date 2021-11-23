export interface ISendingTransactionData {
    privateKey: string;
    receiverAddress: string;
    amount: number;
    /**
     * @desc take fee in main chain token
     */
    fee: string;
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
    fee: number;
}
export interface IFee {
    value: string;
    usd: string;
}
//# sourceMappingURL=transaction.d.ts.map