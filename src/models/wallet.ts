export interface IWallet {
  address: IAddress;
  privateKey: string;
  publicKey: string;
  balance: string;
}

export interface IAddress {
  base58: string;
  hex: string;
}
