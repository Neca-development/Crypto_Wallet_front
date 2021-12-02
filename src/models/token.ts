export interface IToken {
  balance: number;
  balanceInUSD: number;
  tokenPriceInUSD: number;
  tokenName: string;
  contractAddress?: string;
  tokenType?: string;
  tokenLogo?: string;
}
