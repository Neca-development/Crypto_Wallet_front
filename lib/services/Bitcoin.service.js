// @ts-ignore
import bitcore from 'bitcore-lib';
export class bitcoinService {
    generateKeyPair(mnemonic) {
        this.mnemonic = mnemonic;
        let value = Buffer.from(mnemonic);
        let hash = bitcore.crypto.Hash.sha256(value);
        const bn = bitcore.crypto.BN.fromBuffer(hash);
        // const wif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';
        const privateKey = new bitcore.PrivateKey(bn);
        const address = new bitcore.PrivateKey(bn).toAddress();
        // var privateKey = new bitcore.PrivateKey();
        // var address = privateKey.toAddress();
        // var ck = CoinKey.fromWif(wif)
        return {
            privateKey: privateKey,
            publicKey: address,
        };
        // throw new Error("Method not implemented.");
    }
    generatePublicKey() {
        let value = Buffer.from(this.mnemonic);
        let hash = bitcore.crypto.Hash.sha256(value);
        const bn = bitcore.crypto.BN.fromBuffer(hash);
        const address = new bitcore.PrivateKey(bn).toAddress();
        return address;
        // throw new Error("Method not implemented.");
    }
    getTokensByAddress() {
        throw new Error("Method not implemented.");
    }
    getTransactionsHistoryByAddress() {
        throw new Error("Method not implemented.");
    }
    getFeePriceOracle() {
        throw new Error("Method not implemented.");
    }
    sendMainToken() {
        throw new Error("Method not implemented.");
    }
    send20Token() {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=Bitcoin.service.js.map