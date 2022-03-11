import * as bip39 from 'bip39'

export function helloWorld() {
    console.log("hello world!");
    console.log(bip39.generateMnemonic());
}