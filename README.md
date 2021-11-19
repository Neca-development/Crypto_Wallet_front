# Crypto Wallet Core

---

## Установка проекта

1. Для начала нужно установить зависимости проекта запустив

```
npm install
```

2. Далее импортировать класс WalletFactory и создать экземпляр класса

```
import { WalletFactory } from "../../lib/main";

const wf = new WalletFactory();
```

3. Для генерации кошельков вызвать у экземпляра метод createWallets(mnemonic?: string). Параметр menominc явлеется опциональным и необходим для восстановления имеющихся кошельков при помощи мнемонической фразы.

```
const wallets = await wf.createWallets(mnemonic);
```

---

Подробная информацию по свойствам и методам кошелька находится в документации по [ссылке](classes/Wallet.html)
Демонстрация работы библиотеки находится в папке `demo`

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
