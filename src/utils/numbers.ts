/**
 * 描述
 * @param {number} decimalLength:number
 * @returns {number}
 */
export function getNumberFromDecimal(decimalLength: number): number {
  return parseInt('1'.padEnd(decimalLength, '0'));
}
