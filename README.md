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

Detailed information on the properties and methods of the wallet can be found in the documentation at [link](classes/Wallet.html)
A demo of the library can be found in the folder `demo`

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
