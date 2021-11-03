export interface IWallet {
  address: IAddress;
  privateKey: string;
  publicKey: string;
}

export interface IAddress {
  base58: string;
  hex: string;
}
