import { backendApi, imagesURL } from '../constants/providers';
import { backendApiKey } from '../constants/providers';
// @ts-ignore
import axios from 'axios';
import { MainnetConfig } from '@avalabs/avalanche-wallet-sdk';
import { Avalanche, BN, HDNode, Mnemonic, utils } from 'avalanche';
export class avalancheService {
    constructor() {
        this.networkConfog = MainnetConfig;
        this.avaxAssetId = utils.Defaults.network[this.networkConfog.networkID].X['avaxAssetID'];
        const { apiIp: ip, apiPort: port, apiProtocol: protocol, networkID } = this.networkConfog;
        const avalanche = new Avalanche(ip, port, protocol, networkID);
        this.xchain = avalanche.XChain();
    }
    async generateKeyPair(mnemonic) {
        const mnemonicInst = Mnemonic.getInstance();
        const xKeychain = this.xchain.keyChain();
        const seed = mnemonicInst.mnemonicToSeedSync(mnemonic);
        const hdnode = new HDNode(seed);
        const child = hdnode.derive(`m/44'/9000'/0'/0/0`);
        xKeychain.importKey(child.privateKeyCB58);
        const keys = xKeychain.getKey(xKeychain.getAddresses()[0]);
        const publicKey = keys.getAddressString();
        const privateKey = keys.getPrivateKeyString();
        this.keys = {
            privateKey,
            publicKey,
        };
        return this.keys;
    }
    async generatePublicKey(privateKey) {
        const xKeychain = this.xchain.keyChain();
        xKeychain.importKey(privateKey);
        const keys = xKeychain.getKey(xKeychain.getAddresses()[0]);
        const publicKey = keys.getAddressString();
        this.keys = {
            privateKey,
            publicKey,
        };
        return publicKey;
    }
    async getTokensByAddress(address) {
        const tokens = [];
        const { data: ethToUSD } = await axios.get(`${backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': backendApiKey,
            },
        });
        const AVAX = await this.xchain.getBalance(address, 'AVAX');
        const nativeTokensBalance = AVAX.balance / 1e9;
        tokens.push(this.generateTokenObject(nativeTokensBalance, 'AVAX', imagesURL + 'AVAX.svg', 'native', ethToUSD.data.usd));
        return tokens;
    }
    async getFeePriceOracle(from, to) {
        const { data: ethToUSD } = await axios.get(`${backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': backendApiKey,
            },
        });
        const value = this.xchain.getDefaultTxFee().toNumber() / 1e9;
        const usd = Math.trunc(value * Number(ethToUSD.data.usd) * 100) / 100;
        return {
            value,
            usd,
        };
    }
    /**
     * @param {ISendingTransactionData} data:ISendingTransactionData
     * @returns {any}
     */
    async getTransactionsHistoryByAddress(address) {
        const { data: ethToUSD } = await axios.get(`${backendApi}coins/ETH`, {
            headers: {
                'auth-client-key': backendApiKey,
            },
        });
        console.log(ethToUSD);
        const balance = await this.xchain.getBalance(address, 'AVAX');
        const txs = balance.utxoIDs.map((el) => {
            return el.txID;
        });
        console.log(txs);
        const unifierTx = [];
        await Promise.all(txs.map((txID) => {
            return new Promise(async (resolve) => {
                const tx = await this.xchain.callMethod('avm.getTx', { txID, encoding: 'json' });
                unifierTx.push(tx.data.result.tx);
                resolve();
            });
        }));
        console.log(unifierTx);
        let transactions = [];
        unifierTx.forEach((val) => {
            console.log(val);
            transactions.push(...val.unsignedTx.inputs.map((el) => this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), 'IN')));
            transactions.push(...val.unsignedTx.outputs.map((el) => this.convertTransactionToCommonFormat(el, address, Number(ethToUSD.data.usd), 'OUT')));
        });
        console.log(transactions);
        // transactions.sort((a, b) => {
        //     if (a.timestamp > b.timestamp) {
        //         return -1;
        //     } else if (a.timestamp < b.timestamp) {
        //         return 1;
        //     } else {
        //         return 0;
        //     }
        // });
        return transactions;
    }
    async sendMainToken(data) {
        const address = this.keys.publicKey;
        let { utxos } = await this.xchain.getUTXOs(address);
        let sendAmount = new BN(data.amount * 1e9); //amounts are in BN format
        let unsignedTx = await this.xchain.buildBaseTx(utxos, sendAmount, this.avaxAssetId, [data.receiverAddress], [address], [address]);
        let signedTx = unsignedTx.sign(this.xchain.keyChain());
        let txid = await this.xchain.issueTx(signedTx);
        return txid;
    }
    async send20Token(data) {
        throw new Error('Avalance Xchain doesnt support this method');
    }
    // -------------------------------------------------
    // ********** PRIVATE METHODS SECTION **************
    // -------------------------------------------------
    generateTokenObject(balance, tokenName, tokenLogo, tokenType, ethToUSD, ethToCustomToken, contractAddress) {
        let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(ethToCustomToken)) * Number(ethToUSD) : Number(ethToUSD);
        tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;
        const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
        const standard = tokenType === 'custom' ? 'ERC 20' : null;
        return {
            standard,
            balance,
            balanceInUSD,
            contractAddress,
            tokenName,
            tokenType,
            tokenPriceInUSD,
            tokenLogo,
        };
    }
    /**
     * @param {any} txData:any
     * @param {string} address:string
     * @param {number} trxToUSD:number
     * @returns {ITransaction}
     */
    convertTransactionToCommonFormat(txData, address, tokenPriceToUSD, direction) {
        var _a;
        let amount = direction == 'IN'
            ? txData.input.amount * 10e-10
            : txData.output.amount * 10e-10;
        let amountPriceInUSD = Math.trunc(amount * tokenPriceToUSD * 100) / 100;
        const tokenName = 'AVAX';
        const tokenLogo = imagesURL + tokenName + '.svg';
        const to = direction === 'OUT' ? (_a = txData.output.addresses) === null || _a === void 0 ? void 0 : _a[0] : 'unknown';
        const from = direction === 'IN' ? 'unknown' : 'unknown';
        return {
            to,
            from,
            amount: amount.toString(),
            amountInUSD: amountPriceInUSD.toString(),
            txId: txData.txID,
            direction,
            tokenName,
            timestamp: undefined,
            fee: undefined,
            status: true,
            tokenLogo,
        };
    }
}
//# sourceMappingURL=Avalanche.service.js.map