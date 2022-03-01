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
    destinationTag?: number;
    speed: 'slow' | 'medium' | 'fast';
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
    status?: boolean;
    type?: 'TransferContract' | 'TriggerSmartContract';
    tokenLogo: string;
    fee: number;
}
export interface IFee {
    value: number;
    usd: number;
}
//# sourceMappingURL=transaction.d.ts.map