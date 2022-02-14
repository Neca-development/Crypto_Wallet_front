# Crypto Wallet Core

---

## Supported blockchains

- Tron
- Ethereum
- EthereumClassic
- Binance
- Solana
- Polygon
- Bitcoin
- Litecoin
- Bitcoincash
- Dogecoin
- DASH
- ZCASH
- Ripple

## Project installation

1. To begin, you must install the project dependencies by running

```
npm install
```

2. Next, import the WalletFactory class and create an instance of the class

```
import { WalletFactory } from "Crypto_Wallet/lib/main";

const wf = new WalletFactory();
```

3. To generate wallets, call the instance's method createWallets(mnemonic?: string). The menominc parameter is optional and is required to restore existing wallets using a mnemonic phrase.

```
const wallets = await wf.createWallets(mnemonic);
```

---

## WARNING!

To use ZCASH you need to remove type checking from "fromPrivateKey" method of bitcoin-js-lib  
Path:

```
...\Crypto_Wallet\node_modules\@bitgo\utxo-lib\node_modules\bitcoinjs-lib\src\ecpair.js
```

Function you need to find:

```
function fromPrivateKey(buffer, options) {
  typeforce(types.Buffer256bit, buffer);
  if (!ecc.isPrivate(buffer))
    throw new TypeError('Private key not in range [1, n)');
  typeforce(isOptions, options);
  return new ECPair(buffer, undefined, options);
}
```

Code you need to remove from "fromPrivateKey" method

```
typeforce(isOptions, options);
```

Detailed information on the properties and methods of the wallet can be found in the documentation at [link](https://crypto-wallet-docs.herokuapp.com/res/classes/Wallet.html)  
A demo of the library can be found in the folder `demo`

---

## Fee Calculation

- ### Tron

  `Native token transaction:` sending for free while you have enough BandWith, after all the BandWith has been used up, the network will automatically buy the required amount to send the transaction.

  `Smart contracts interaction (sending smart token):` hardcoded and cost 10 TRX

- ### Ethereum

  `Native token transaction:` The fee for sending a transaction is the result of multiplying the spent gas (considered by the library) and the cost of one unit of gas (requested from the resource).

  `Smart contracts interaction (sending smart token):` hardcoded and cost 100000 Wei

- ### EthereumClassic

  `Native token transaction:` The fee for sending a transaction is the result of multiplying the spent gas (considered by the library) and the cost of one unit of gas (considered by the library).

- ### Binance

  `Native token transaction:` The fee for sending a transaction is the result of multiplying the spent gas (considered by the library) and the cost of one unit of gas (considered by the library).

  `Smart contracts interaction (sending smart token):` hardcoded and cost 100000 Wei

- ### Solana

  `Native token transaction:` The amount of fee is always the same for any transaction and costs 5000 lamports (0.000005 SOL).

  `Smart contracts interaction (sending smart token):` Same as native token transaction.

- ### Polygon

  `Native token transaction:` The fee for sending a transaction is the result of multiplying the spent gas (considered by the library) and the cost of one unit of gas (requested from the resource).

  `Smart contracts interaction (sending smart token):` hardcoded and cost 100000 Wei.

- ### Bitcoin

  `Native token transaction:` Fee calculated by formula

  ```
  (inputCount * 146 + outputCount * 33 + 10) * multiplier
  ```

  where multiplier = 20

- ### Litecoin

  `Native token transaction:` Fee calculated by formula

  ```
  (inputCount * 146 + outputCount * 33 + 10) * multiplier
  ```

  where multiplier = 4000

- ### Bitcoincash

  `Native token transaction:` Fee calculated by formula

  ```
  this.bitbox.BitcoinCash.getByteCount({ P2PKH: inputCount }, { P2PKH: 2 }) * multiplier
  ```

  where getByteCount is library method,  
  multiplier is constant and equals to 1.3

- ### Dogecoin

  `Native token transaction:` Fee calculated by formula

  ```
  (inputCount * 146 + outputCount * 33 + 10) * multiplier
  ```

  where multiplier = 10316

- ### DASH

  `Native token transaction:` Fee calculated by formula

  ```
  (inputCount * 146 + outputCount * 33 + 10) * multiplier
  ```

  where multiplier = 400

- ### ZCASH

  `Native token transaction:` Fee calculated by formula

  ```
  (inputCount * 146 + outputCount * 33 + 10) * multiplier
  ```

  where multiplier = 400

- ### Ripple

  `Native token transaction:` Fee considered by library, ussualy 12 "drops" of XRP, where 1,000,000 drops equals 1 XRP

---

## Project scripts

```

npm install

```

### Run demo template

```

npm run start

```

### Compile documentation

```

npm run docs

```

### Compile js from ts

```

npm run compile

```

```

```
