"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = exports.WalletFactory = exports.Wallet = void 0;
const wallet_factory_1 = require("./wallet-factory");
// classes
var wallet_1 = require("./wallet");
Object.defineProperty(exports, "Wallet", { enumerable: true, get: function () { return wallet_1.Wallet; } });
var wallet_factory_2 = require("./wallet-factory");
Object.defineProperty(exports, "WalletFactory", { enumerable: true, get: function () { return wallet_factory_2.WalletFactory; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "CustomError", { enumerable: true, get: function () { return errors_1.CustomError; } });
// @ts-ignore
window.WalletFactory = wallet_factory_1.WalletFactory;
//# sourceMappingURL=main.js.map