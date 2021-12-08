export interface IToken {
    balance: number;
    balanceInUSD: number;
    tokenPriceInUSD: number;
    tokenName: string;
    contractAddress?: string;
    tokenType?: string;
    tokenLogo?: string;
}
export interface ICryptoCurrency {
    coinName: string;
    id: number;
    usd: string;
    usdt?: string;
}
//# sourceMappingURL=token.d.ts.map