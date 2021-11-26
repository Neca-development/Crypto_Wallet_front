export interface IWallet {
  address: string;
  privateKey: string;
  publicKey: string;
  balance?: IBalance;
  chainId: string;
}

export interface IBalance {
  coin: number;
  usd: string;
}
