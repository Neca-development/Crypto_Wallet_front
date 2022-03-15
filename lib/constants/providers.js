"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.harmonyUSDTContractAddress = exports.harmonyProvider = exports.blockChairAPI = exports.rippleProvider = exports.zcashSatoshisPerByte = exports.dashSatoshisPerByte = exports.bitcoincashSatoshisPerByte = exports.litecoinSatoshisPerByte = exports.dogeSatoshisPerByte = exports.bitcoinFeesURL = exports.bitcoinSatoshisPerByte = exports.etcWeb3Provider = exports.polygonGasPrice = exports.polygonUSDTContractAddress = exports.polygonWeb3Provider = exports.solanaUSDTContractAddress = exports.binanceScanApi = exports.binanceUSDTContractAddress = exports.binanceWeb3Provider = exports.etherGasPrice = exports.etherUSDTContractAddress = exports.etherScanApiKey = exports.etherScanApi = exports.ethWeb3Provider = exports.tronUSDTContractAddress = exports.tronWebProvider = exports.bitqueryProxy = exports.imagesURL = exports.backendApi = exports.backendApiKey = void 0;
exports.backendApiKey = 'ba9713548726a8b17bcd316e7044c20d';
exports.backendApi = 'https://wallet-api.sawe.dev/api/';
// export const backendApi = 'http://135.181.216.90:49358/api/';
exports.imagesURL = `${exports.backendApi}images/`;
exports.bitqueryProxy = `${exports.backendApi}bitquery`;
// --- Tron ---
exports.tronWebProvider = {
    fullHost: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
    eventServer: 'https://api.trongrid.io',
};
// export const tronUSDTContractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
exports.tronUSDTContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
// --- Ether ---
// export const ethWeb3Provider = 'https://rinkeby.infura.io/v3/522b462c9a1d45fb9b3b18b5fda51c05';
exports.ethWeb3Provider = 'https://mainnet.infura.io/v3/522b462c9a1d45fb9b3b18b5fda51c05';
exports.etherScanApi = 'https://api-rinkeby.etherscan.io/api';
exports.etherScanApiKey = 'S18IGMPYTDRZ1CQJRHZIR5QE5F5AS2K16U';
// export const etherUSDTContractAddress = '0xd92e713d051c37ebb2561803a3b5fbabc4962431';
exports.etherUSDTContractAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
exports.etherGasPrice = 'https://ethgasstation.info/api/ethgasAPI.json?api-key=d1c0caed8c46a0969ed707db1b8c6b08aab8861f223997cca266ee6ac5cc';
// --- Binance ---
// export const binanceWeb3Provider = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
exports.binanceWeb3Provider = 'https://bsc-dataseed.binance.org/';
// export const binanceUSDTContractAddress = '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd';
exports.binanceUSDTContractAddress = '0xe9e7cea3dedca5984780bafc599bd69add087d56';
exports.binanceScanApi = 'https://api-testnet.bscscan.com/api';
// --- Solana ---
exports.solanaUSDTContractAddress = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
// --- Polygon ---
// MATIC(mainnet)
exports.polygonWeb3Provider = 'https://polygon-rpc.com/';
// MUMBAI(testnet)
// export const polygonWeb3Provider = 'https://rpc-mumbai.maticvigil.com/'
// USDT
exports.polygonUSDTContractAddress = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';
//TEST USDT
// export const polygonUSDTContractAddress = '0xe07D7B44D340216723eD5eA33c724908B817EE9D'
exports.polygonGasPrice = 'https://gasstation-mainnet.matic.network';
// --- Ethereum Classic ---
exports.etcWeb3Provider = 'https://www.ethercluster.com/etc';
// ------------- BITCOIN -----------------
exports.bitcoinSatoshisPerByte = 20;
exports.bitcoinFeesURL = 'https://bitcoinfees.earn.com/api/v1/fees/recommended';
// ------------- DOGECOIN -----------------
exports.dogeSatoshisPerByte = 206320;
// ------------- LITECOIN -----------------
exports.litecoinSatoshisPerByte = 4000;
// ------------- BITCOIN CASH -----------------
exports.bitcoincashSatoshisPerByte = 1.3;
// ------------- DASH -----------------
exports.dashSatoshisPerByte = 400;
// ------------- ZCASH -----------------
exports.zcashSatoshisPerByte = 400;
// -------------- Ripple ------------------------
// export const rippleProvider = 'wss://s.altnet.rippletest.net:51233';
exports.rippleProvider = 'wss://xrplcluster.com';
// -------------- Polkadot ------------------------
// export const polkadotProvider =
exports.blockChairAPI = 'https://api.blockchair.com/polkadot/raw/address/';
// ------------- Harmony -------------------------
exports.harmonyProvider = 'https://api.harmony.one/';
// export const harmonyProvider = 'https://api.s0.b.hmny.io'
exports.harmonyUSDTContractAddress = '0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f';
// ------------- Avalanche -------------------------
//# sourceMappingURL=providers.js.map