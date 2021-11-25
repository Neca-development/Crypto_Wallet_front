/**
 * 描述
 * @param {number} decimalLength:number
 * @returns {number}
 */
export function getNumberFromDecimal(decimalLength) {
    const bigInt = BigInt('1'.padEnd(decimalLength + 1, '0'));
    return Number(bigInt);
}
//# sourceMappingURL=numbers.js.map