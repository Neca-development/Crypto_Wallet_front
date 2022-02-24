// import { isHex } from '@polkadot/util';
// import { bip39ToMiniSecret } from '@polkadot/wasm-crypto';
// import { decodePair } from '@polkadot/keyring/pair/decode';
// import { IWalletKeys } from './models/wallet';
//
// export class Keyring{
//   private
//   constructor() {
//
//   }
//   private createPair ({ toSS58, type }: Setup, { publicKey, privateKey }: IWalletKeys, encoded: Uint8Array | null = null): IWalletKeys {
//     const decodePkcs8 = (passphrase?: string, userEncoded?: Uint8Array | null): void  {
//       const decoded = decodePair(passphrase, userEncoded || encoded, encTypes);
//
//       if (decoded.secretKey.length === 64) {
//         publicKey = decoded.publicKey;
//         secretKey = decoded.secretKey;
//       } else {
//         const pair = TYPE_FROM_SEED[type](decoded.secretKey);
//
//         publicKey = pair.publicKey;
//         privateKey = pair.secretKey;
//       }
//     };
//   }
//   public addFromUri (suri: string, meta: KeyringPair$Meta = {}, type: KeypairType = this.type): KeyringPair {
//     return this.addPair(
//       this.createFromUri(mnemonic)
//     );
//   }
//   public createFromUri (mnemonic):  {
//     // here we only aut-add the dev phrase if we have a hard-derived path
//
//     let seed: Uint8Array;
//       const parts = mnemonic.split(' ');
//
//       if ([12, 15, 18, 21, 24].includes(parts.length)) {
//         seed = bip39ToMiniSecret(mnemonic, '123');
//       }
//     }
//
//     return createPair({ toSS58: this.encodeAddress, type }, derived, meta, null);
//   }
// }