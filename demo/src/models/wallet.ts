export interface IWallet {
  address: IAddress;
  privateKey: string;
  publicKey: string;
  balance?: IBalance;
}

export interface IAddress {
  base58: string;
  hex: string;
}

export interface IBalance {
  coin: number;
  usd: string;
}
