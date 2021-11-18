import { TokenType } from "./enums";

export interface IToken {
  tokenPriceInChainCoin: string;
  tokenPriceInUSD: number;
  tokenId: string;
  balance: string;
  tokenName: string;
  tokenAbbr: string;
  tokenType: TokenType;
  tokenLogo?: string;
  contractAddress?: string;
}
