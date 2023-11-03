"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorsTypes = exports.ChainIds = void 0;
var ChainIds;
(function (ChainIds) {
    ChainIds[ChainIds["Ethereum"] = 0] = "Ethereum";
    ChainIds[ChainIds["EthereumClassic"] = 1] = "EthereumClassic";
    ChainIds[ChainIds["Binance"] = 2] = "Binance";
    ChainIds[ChainIds["Solana"] = 3] = "Solana";
    ChainIds[ChainIds["Polygon"] = 4] = "Polygon";
    ChainIds[ChainIds["Ripple"] = 5] = "Ripple";
    ChainIds[ChainIds["Harmony"] = 6] = "Harmony";
    ChainIds[ChainIds["Avalanche"] = 7] = "Avalanche";
    // 'Tron',
    // 'Bitcoin',
    // 'Litecoin',
    // 'Bitcoincash',
    // 'Dogecoin',
    // 'Dash',
    // 'Zcash',
    // 'Polkadot',
    // --- (Deprecated) ---
    // 'Neo',
})(ChainIds = exports.ChainIds || (exports.ChainIds = {}));
var ErrorsTypes;
(function (ErrorsTypes) {
    ErrorsTypes[ErrorsTypes["Invalid data"] = 0] = "Invalid data";
    ErrorsTypes[ErrorsTypes["Insufficient data"] = 1] = "Insufficient data";
    ErrorsTypes[ErrorsTypes["Network error"] = 2] = "Network error";
    ErrorsTypes[ErrorsTypes["Unknown error"] = 3] = "Unknown error";
})(ErrorsTypes = exports.ErrorsTypes || (exports.ErrorsTypes = {}));
//# sourceMappingURL=enums.js.map