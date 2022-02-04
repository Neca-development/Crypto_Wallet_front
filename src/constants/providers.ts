export const backendApiKey = 'ba9713548726a8b17bcd316e7044c20d';

export const backendApi = 'https://wallet-api.sawe.dev/api/';
// export const backendApi = 'http://135.181.216.90:49358/api/';

export const imagesURL = `${backendApi}images/`;

export const bitqueryProxy = `${backendApi}bitquery`;

// --- Tron ---
export const tronWebProvider = {
  fullHost: 'https://api.trongrid.io',
  solidityNode: 'https://api.trongrid.io',
  eventServer: 'https://api.trongrid.io',
};

// export const tronUSDTContractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
export const tronUSDTContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// --- Ether ---
export const ethWeb3Provider = 'https://rinkeby.infura.io/v3/522b462c9a1d45fb9b3b18b5fda51c05';

export const etherScanApi = 'https://api-rinkeby.etherscan.io/api';

export const etherScanApiKey = 'S18IGMPYTDRZ1CQJRHZIR5QE5F5AS2K16U';

export const etherUSDTContractAddress = '0xd92e713d051c37ebb2561803a3b5fbabc4962431';

export const etherGasPrice =
  'https://ethgasstation.info/api/ethgasAPI.json?api-key=d1c0caed8c46a0969ed707db1b8c6b08aab8861f223997cca266ee6ac5cc';

// --- Binance ---

export const binanceWeb3Provider = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

export const binanceUSDTContractAddress = '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd';

export const binanceScanApi = 'https://api-testnet.bscscan.com/api';

// --- Solana ---

export const solanaUSDTContractAddress = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

// --- Polygon ---

// MATIC(mainnet)
export const polygonWeb3Provider = 'https://polygon-rpc.com/';
// MUMBAI(testnet)
// export const polygonWeb3Provider = 'https://rpc-mumbai.maticvigil.com/'

// USDT
export const polygonUSDTContractAddress = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f';
//TEST USDT
// export const polygonUSDTContractAddress = '0xe07D7B44D340216723eD5eA33c724908B817EE9D'

export const polygonGasPrice = 'https://gasstation-mainnet.matic.network';

// --- Ethereum Classic ---

export const etcWeb3Provider = 'https://www.ethercluster.com/etc';

// ------------- DOGECOIN -----------------

export const dogeSatoshisPerByte = 10316;

// ------------- LITECOIN -----------------

export const litecoinSatoshisPerByte = 200;

// ------------- BITCOIN CASH -----------------

export const bitcoincashSatoshisPerByte = 1.3;

// ------------- BITCOIN CASH -----------------

export const dashSatoshisPerByte = 20;

// -------------- Ripple ------------------------

export const rippleProvider = 'wss://s.altnet.rippletest.net:51233';
