export interface IToken {
  balance: number;
  balanceInUSD: number;
  tokenPriceInUSD: number;
  tokenId: string;
  tokenName: string;
  tokenAbbr: string;
  contractAddress?: string;
  tokenType?: string;
  tokenLogo?: string;
}
