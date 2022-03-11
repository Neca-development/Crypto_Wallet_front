"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorsTypes = exports.ChainIds = void 0;
var ChainIds;
(function (ChainIds) {
    // 'Tron',
    ChainIds[ChainIds["Ethereum"] = 0] = "Ethereum";
    ChainIds[ChainIds["EthereumClassic"] = 1] = "EthereumClassic";
    ChainIds[ChainIds["Binance"] = 2] = "Binance";
    ChainIds[ChainIds["Solana"] = 3] = "Solana";
    ChainIds[ChainIds["Polygon"] = 4] = "Polygon";
    ChainIds[ChainIds["Bitcoin"] = 5] = "Bitcoin";
    ChainIds[ChainIds["Litecoin"] = 6] = "Litecoin";
    // 'Bitcoincash',
    ChainIds[ChainIds["Dogecoin"] = 7] = "Dogecoin";
    ChainIds[ChainIds["Dash"] = 8] = "Dash";
    ChainIds[ChainIds["Ripple"] = 9] = "Ripple";
    ChainIds[ChainIds["Zcash"] = 10] = "Zcash";
    ChainIds[ChainIds["Polkadot"] = 11] = "Polkadot";
    ChainIds[ChainIds["Harmony"] = 12] = "Harmony";
    ChainIds[ChainIds["Avalanche"] = 13] = "Avalanche";
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