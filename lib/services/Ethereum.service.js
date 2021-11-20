var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { etherScanApi, etherScanApiKey, web3Provider, coinConverterApi, etherUSDTContractAddress, } from "../constants/providers";
// @ts-ignore
import axios from "axios";
import Web3 from "web3";
// @ts-ignore
// import Wallet from "lumi-web-core";
import { ethers } from "ethers";
export class ethereumService {
    constructor() {
        this.web3 = new Web3(web3Provider);
    }
    createWallet(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = ethers.Wallet.fromMnemonic(mnemonic);
            return {
                privateKey: data.privateKey,
                publicKey: data.address,
            };
        });
    }
    getTokensByAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokens = [];
            const { data: ethToUSD } = yield axios.get(`${coinConverterApi}/v3/simple/price?ids=ethereum&vs_currencies=usd,tether`);
            const { data: mainToken } = yield axios.get(`${etherScanApi}?module=account&action=balance&address=${address}&tag=latest&apikey=${etherScanApiKey}`);
            const mainTokenBalanceInUSD = Math.trunc(this.web3.utils.fromWei(mainToken.result) * ethToUSD.ethereum.usd * 100) / 100;
            tokens.push({
                balance: this.web3.utils.fromWei(mainToken.result),
                balanceInUSD: mainTokenBalanceInUSD,
                tokenId: "_",
                contractAddress: "_",
                tokenAbbr: "ETH",
                tokenName: "ETH",
                tokenType: "eth",
                tokenLogo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
                tokenPriceInUSD: ethToUSD.ethereum.usd,
            });
            const { data: USDT } = yield axios.get(`${etherScanApi}?module=account&action=tokenbalance&contractaddress=${etherUSDTContractAddress}&address=${address}&tag=latest&apikey=${etherScanApiKey}`);
            const USDTDecimal = 10e6;
            const USDTbalanceInUSD = Math.trunc((USDT.result / USDTDecimal) * 100) / 100;
            tokens.push({
                balance: USDT.result / USDTDecimal,
                balanceInUSD: USDTbalanceInUSD,
                tokenId: "_",
                contractAddress: "_",
                tokenAbbr: "USDT",
                tokenName: "USD Tether",
                tokenType: "ERC-20",
                tokenLogo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
                tokenPriceInUSD: ethToUSD.ethereum.usd,
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
    sendMainToken(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(data);
            // this.Tron.setPrivateKey(data.privateKey);
            // const address = this.Tron.address.toHex(data.receiverAddress);
            // await this.Tron.trx.sendTransaction(
            //   address,
            //   this.Tron.toSun(data.amount),
            //   data.privateKey
            // );
        });
    }
    send20Token(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(data);
            // this.Tron.setPrivateKey(data.privateKey);
            // const contract = await this.Tron.contract().at(data.cotractAddress);
            // console.log(data);
            // //Use send to execute a non-pure or modify smart contract method on a given smart contract that modify or change values on the blockchain.
            // // These methods consume resources(bandwidth and energy) to perform as the changes need to be broadcasted out to the network.
            // await contract
            //   .transfer(
            //     data.receiverAddress, //address _to
            //     this.Tron.toSun(data.amount) //amount
            //   )
            //   .send({
            //     feeLimit: 10000000,
            //   });
        });
    }
    getTokenContractAddress(tokens, tokenAbbr) {
        const token = tokens.find((x) => x.tokenAbbr === tokenAbbr);
        return token.tokenId;
    }
}
//# sourceMappingURL=Ethereum.service.js.map