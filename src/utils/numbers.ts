import { BigNumber } from 'bignumber.js';

/**
 * @param {number} decimalLength:number
 * @returns {number}
 */
export function getBNFromDecimal(decimalLength: number): BigNumber {
  if (typeof decimalLength !== 'number') {
    throw new Error('length must be a number!');
  }
  return new BigNumber('1'.padEnd(decimalLength + 1, '0'));
}

/**
 * @param {string} val:string
 * @returns {string}
 */
export function removeTrailingZeros(val: string): string {
  return val.replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
}
