export interface IToken {
  tokenPriceInChainCoin: string;
  tokenPriceInUSD: number;
  tokenId: string;
  balance: string;
  tokenName: string;
  tokenAbbr: string;
  tokenType: string;
  tokenLogo?: string;
  contractAddress?: string;
}
