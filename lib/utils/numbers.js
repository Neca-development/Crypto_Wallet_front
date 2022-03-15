"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTrailingZeros = exports.getBNFromDecimal = void 0;
const bignumber_js_1 = require("bignumber.js");
/**
 * @param {number} decimalLength:number
 * @returns {number}
 */
function getBNFromDecimal(decimalLength) {
    if (typeof decimalLength !== 'number') {
        throw new Error('length must be a number!');
    }
    return new bignumber_js_1.BigNumber('1'.padEnd(decimalLength + 1, '0'));
}
exports.getBNFromDecimal = getBNFromDecimal;
/**
 * @param {string} val:string
 * @returns {string}
 */
function removeTrailingZeros(val) {
    return val.replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
}
exports.removeTrailingZeros = removeTrailingZeros;
//# sourceMappingURL=numbers.js.map