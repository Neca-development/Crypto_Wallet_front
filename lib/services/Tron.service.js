var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { tronGridApi, tronScanApi, tronWebProvider, coinConverterApi, } from "../constants/providers";
// @ts-ignore
import TronWeb from "tronweb";
// @ts-ignore
import hdWallet from "tron-wallet-hd";
import axios from "axios";
export class tronService {
    constructor() {
        this.Tron = new TronWeb(tronWebProvider);
    }
    createWallet(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = (yield hdWallet.generateAccountsWithMnemonic(mnemonic, 1))[0];
            return {
                privateKey: data.privateKey,
                publicKey: data.address,
            };
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield axios.get(`${tronScanApi}/account?address=${address}`);
            const trxToUSD = yield axios
                .get(`${coinConverterApi}/v3/simple/price?ids=tron&vs_currencies=usd`)
                .then(({ data }) => data.tron.usd);
            const tokens = data.tokens.map((x) => {
                return {
                    balance: this.Tron.fromSun(x.balance),
                    tokenId: x.tokenId,
                    contractAddress: x.tokenId,
                    tokenAbbr: x.tokenAbbr,
                    tokenName: x.tokenName,
                    tokenType: x.tokenType,
                    tokenLogo: x.tokenLogo,
                    tokenPriceInChainCoin: x.tokenPriceInTrx,
                    tokenPriceInUSD: +x.tokenPriceInTrx * trxToUSD,
                };
            });
            return tokens;
        });
    }
    getTransactionsHistoryByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = [];
            let confirmedTransactions = [];
            let unconfirmedTransactions = [];
            // get last 200 confirmed transactions
            yield axios
                .get(`${tronGridApi}/accounts/${address}/transactions?limit=200&only_confirmed=true&fingerprint`)
                .then(({ data }) => (confirmedTransactions = data.data.map((x) => {
                x.status = "CONFIRMED";
                return x;
            })));
            // get up to 200 last uncofirmed transactions
            yield axios(`${tronGridApi}/accounts/${address}/transactions?limit=200&only_unconfirmed=true`).then(({ data }) => (unconfirmedTransactions = data.data.map((x) => {
                x.status = "UNCONFIRMED";
                return x;
            })));
            transactions.push(...unconfirmedTransactions, ...confirmedTransactions);
            return transactions;
        });
    }
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Tron.setPrivateKey(data.privateKey);
            const address = this.Tron.address.toHex(data.receiverAddress);
            yield this.Tron.trx.sendTransaction(address, this.Tron.toSun(data.amount), data.privateKey);
        });
    }
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Tron.setPrivateKey(data.privateKey);
            const contract = yield this.Tron.contract().at(data.cotractAddress);
            console.log(data);
            //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
            // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
            const result = yield contract
                .transfer(data.receiverAddress, //address _to
            this.Tron.toSun(data.amount) //amount
            )
                .send({
                feeLimit: 10000000,
            });
            console.log(result);
        });
    }
}
//# sourceMappingURL=Tron.service.js.map