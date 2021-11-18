var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore
import TronWeb from "tronweb";
// @ts-ignore
import hdWallet from "tron-wallet-hd";
import axios from "axios";
import Web3 from "web3";
export class tronService {
    constructor() {
        this.Tron = new TronWeb({
            fullHost: "https://api.trongrid.io",
            solidityNode: "https://api.trongrid.io",
            eventServer: "https://api.trongrid.io",
        });
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
    getWalletTokens(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data } = yield axios.get(`https://apilist.tronscan.org/api/account?address=${address}`);
            const web3 = new Web3("https://mainnet.infura.io/v3/522b462c9a1d45fb9b3b18b5fda51c05");
            console.log("ptovider", web3.givenProvider);
            console.log(web3.eth.accounts.create("vote feel bless host burger cash discover direct lyrics hidden organ service"));
            return data.tokens;
        });
    }
    getTransactions(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = [];
            let confirmedTransactions = [];
            let unconfirmedTransactions = [];
            // get last 200 confirmed transactions
            yield axios
                .get(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=200&only_confirmed=true&fingerprint`)
                .then(({ data }) => (confirmedTransactions = data.data.map((x) => {
                x.status = "CONFIRMED";
                return x;
            })));
            // get up to 200 last uncofirmed transactions
            yield axios(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=200&only_unconfirmed=true`).then(({ data }) => (unconfirmedTransactions = data.data.map((x) => {
                x.status = "UNCONFIRMED";
                return x;
            })));
            transactions.push(...unconfirmedTransactions, ...confirmedTransactions);
            return transactions;
        });
    }
    sendTrx(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Tron.setPrivateKey(data.privateKey);
            const address = this.Tron.address.toHex(data.receiverAddress);
            yield this.Tron.trx.sendTransaction(address, this.Tron.toSun(data.amount), data.privateKey);
        });
    }
    sendTRC20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Tron.setPrivateKey(data.privateKey);
            const contract = yield this.Tron.contract().at(data.cotractAddress);
            console.log(data);
            //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
            // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
            yield contract
                .transfer(data.receiverAddress, //address _to
            this.Tron.toSun(data.amount) //amount
            )
                .send({
                feeLimit: 10000000,
            });
        });
    }
    getTokenContractAddress(tokens, tokenAbbr) {
        const token = tokens.find((x) => x.tokenAbbr === tokenAbbr);
        return token.tokenId;
    }
}
//# sourceMappingURL=Tron.service.js.map