"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorsTypes = exports.ChainIds = void 0;
var ChainIds;
(function (ChainIds) {
    ChainIds[ChainIds["Tron"] = 0] = "Tron";
    ChainIds[ChainIds["Ethereum"] = 1] = "Ethereum";
    ChainIds[ChainIds["EthereumClassic"] = 2] = "EthereumClassic";
    ChainIds[ChainIds["Binance"] = 3] = "Binance";
    ChainIds[ChainIds["Solana"] = 4] = "Solana";
    ChainIds[ChainIds["Polygon"] = 5] = "Polygon";
    ChainIds[ChainIds["Bitcoin"] = 6] = "Bitcoin";
    ChainIds[ChainIds["Litecoin"] = 7] = "Litecoin";
    // 'Bitcoincash',
    ChainIds[ChainIds["Dogecoin"] = 8] = "Dogecoin";
    ChainIds[ChainIds["Dash"] = 9] = "Dash";
    ChainIds[ChainIds["Ripple"] = 10] = "Ripple";
    ChainIds[ChainIds["Zcash"] = 11] = "Zcash";
    ChainIds[ChainIds["Polkadot"] = 12] = "Polkadot";
    ChainIds[ChainIds["Harmony"] = 13] = "Harmony";
    ChainIds[ChainIds["Avalanche"] = 14] = "Avalanche";
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