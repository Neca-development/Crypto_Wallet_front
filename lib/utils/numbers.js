/**
 * 描述
 * @param {number} decimalLength:number
 * @returns {number}
 */
export function getNumberFromDecimal(decimalLength) {
    let decimal = '1';
    for (let i = 0; i < decimalLength; i++) {
        decimal += '0';
    }
    return parseInt(decimal);
}
//# sourceMappingURL=numbers.js.map