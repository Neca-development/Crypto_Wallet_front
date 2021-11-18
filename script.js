import { WalletFactory } from './lib/main';

const wf = new WalletFactory;


(async () => {
    const wallets = await wf.createWallets("light afraid crawl solve chicken receive sound prize figure turn punch angry");

    console.log(await wallets[0].getTokensByAddress());
    console.log(await wallets[0].getTransactionsHistoryByAddress());
    console.log(wallets[0].address);
})()

