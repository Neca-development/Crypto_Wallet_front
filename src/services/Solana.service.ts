import { IChainService, ISendingTransactionData, IToken, ITransaction } from '../main';
import {IFee, ITransactionsData} from '../models/transaction';

import * as solanaWeb3 from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, LAMPORTS_PER_SOL, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import axios from 'axios';
import { backendApi, backendApiKey, bitqueryProxy, imagesURL, solanaUSDTContractAddress } from '../constants/providers';
import { ICryptoCurrency } from '../models/token';
import { IResponse } from '../models/response';

export class solanaService implements IChainService {
  private address: Keypair;
  private connection: Connection;

  constructor() {
    this.connection = new Connection(clusterApiUrl('mainnet-beta'));
  }

  async generateKeyPair(mnemonic: string) {
    const derivePath = "m/44'/501'/0'/0'";
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const derivedSeed = ed25519.derivePath(derivePath, seed.toString('hex')).key;
    this.address = Keypair.fromSeed(derivedSeed);

    return {
      privateKey: this.address.secretKey.toString(),
      publicKey: this.address.publicKey.toString(),
    };
  }

  generatePublicKey(privateKey: string): Promise<string> {
    const arr = privateKey.split(',').map(Number);
    let secretKey = Uint8Array.from(arr);
    const address = Keypair.fromSecretKey(secretKey);
    // @ts-ignore
    return address.publicKey;
  }

  async getTokensByAddress(address: string): Promise<IToken[]> {
    const tokens: Array<IToken> = [];
    const { data: solToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/SOL`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const balance = await this.connection.getBalance(new PublicKey(address));

    tokens.push(this.generateTokenObject(balance / LAMPORTS_PER_SOL, 'SOL', imagesURL + 'SOL.svg', 'native', solToUSD.data.usd));

    // USDT Balance
    const info = await this.connection.getTokenAccountsByOwner(new PublicKey(address), {
      mint: new PublicKey(solanaUSDTContractAddress),
    });
    let USDTTokenBalance;
    if (info.value[0]) {
      const tokenBalance = await this.connection.getTokenAccountBalance(new solanaWeb3.PublicKey(info.value[0].pubkey));
      USDTTokenBalance = tokenBalance.value.uiAmount;
    } else {
      USDTTokenBalance = 0;
    }

    tokens.push(
      this.generateTokenObject(
        USDTTokenBalance,
        'Tether USDT',
        imagesURL + 'USDT.svg',
        'custom',
        solToUSD.data.usd,
        solToUSD.data.usdt,
        solanaUSDTContractAddress
      )
    );

    return tokens;
  }

  async getFeePriceOracle(from: string, to: string, amount?: number | null, tokenTypes?: 'native' | 'custom'): Promise<IFee> {
    const { data: solToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/SOL`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const current_slot_time = 0.5;
    const feeInSol = tokenTypes == 'native' ? current_slot_time * 0.00001 : null;
    const usd = Math.trunc(feeInSol * Number(solToUSD.data.usd) * 100) / 100;

    return {
      value: feeInSol,
      usd: usd,
    };
  }

  async sendMainToken(data: ISendingTransactionData): Promise<string> {
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: this.address.publicKey,
        toPubkey: new PublicKey(data.receiverAddress),
        lamports: data.amount * LAMPORTS_PER_SOL,
      })
    );

    const signature = await solanaWeb3.sendAndConfirmTransaction(this.connection, transaction, [this.address]);
    return signature;
  }

  async send20Token(data: ISendingTransactionData): Promise<string> {
    const mintToken = new Token(this.connection, new PublicKey(data.cotractAddress), TOKEN_PROGRAM_ID, this.address);

    const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(this.address.publicKey);
    const receiverAddress = new PublicKey(data.receiverAddress);
    const toTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(receiverAddress);

    const transaction = new solanaWeb3.Transaction().add(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        this.address.publicKey,
        [],
        data.amount * 100
      )
    );

    const signature = await solanaWeb3.sendAndConfirmTransaction(this.connection, transaction, [this.address], {
      commitment: 'confirmed',
    });

    return signature;
  }

  async getTransactionsHistoryByAddress(address: any, pageNumber?:number, pageSize?:number): Promise<ITransactionsData> {
    const { data: solToUSD } = await axios.get<IResponse<ICryptoCurrency>>(`${backendApi}coins/SOL`, {
      headers: {
        'auth-client-key': backendApiKey,
      },
    });

    const queries = [];
    let transactions = [];

    queries.push(this.generateTransactionsQuery(address, 'receiver'));
    queries.push(this.generateTransactionsQuery(address, 'sender'));

    for (const query of queries) {
      let { data: resp } = await axios.post(
        bitqueryProxy,
        {
          body: { query: query, variables: {} },
        },
        {
          headers: {
            'auth-client-key': backendApiKey,
          },
        }
      );

      transactions.push(...resp.data.data.solana.transfers);
    }

    if (transactions.length === 0) {
      return {transactions:[], length:0};
    }

    transactions = transactions.map((el: any) => this.convertTransactionToCommonFormat(el, address, Number(solToUSD.data.usd)));

    transactions.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return -1;
      } else if (a.timestamp < b.timestamp) {
        return 1;
      } else {
        return 0;
      }
    });
    const length = transactions.length
    if(pageNumber || pageNumber===0) {
      transactions = transactions.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    }
    return {
      transactions, length
    };
  }

  // -------------------------------------------------
  // ********** PRIVATE METHODS SECTION **************
  // -------------------------------------------------

  private generateTokenObject(
    balance: number,
    tokenName: string,
    tokenLogo: string,
    tokenType: 'native' | 'custom',
    solToUSD: string,
    solToCustomToken?: string,
    contractAddress?: string
  ): IToken {
    let tokenPriceInUSD = tokenType === 'custom' ? (1 / Number(solToCustomToken)) * Number(solToUSD) : Number(solToUSD);
    tokenPriceInUSD = Math.trunc(tokenPriceInUSD * 100) / 100;

    const balanceInUSD = Math.trunc(balance * tokenPriceInUSD * 100) / 100;
    const standard = tokenType === 'custom' ? 'SPL Token' : null;

    return {
      standard,
      balance,
      balanceInUSD,
      tokenName,
      tokenType,
      tokenPriceInUSD,
      tokenLogo,
      contractAddress,
    };
  }

  private generateTransactionsQuery(address: string, direction: 'receiver' | 'sender') {
    return `
      query{
      solana(network: solana) {
        transfers(
          options: {desc: "any", limit: 1000}
          ${direction}Address: {is: "PinYvHqMTZVrRTpwK9x3dB9vL7tsGtGedSz8EqeynuA"}
          date: {after: "2021-12-01"}
        ) {
          any(of: time)
          receiver {
            address
          }
          sender {
            address
          }
          transaction {
            fee
            transactionIndex
            success
          }
          currency {
            symbol
            name
            tokenType
          }
          amount
        }
      }
    }
    `;
  }

  /**
   * @param {any} txData:any
   * @param {string} address:string
   * @param {number} trxToUSD:number
   * @returns {ITransaction}
   */
  private convertTransactionToCommonFormat(txData: any, address: string, trxToUSD: number): ITransaction {
    const tokenLogo = imagesURL + txData.currency.symbol.toUpperCase() + '.svg';
    const to = txData.receiver.address;
    const from = txData.sender.address;
    const amount = txData.amount;
    const direction = from === address ? 'OUT' : 'IN';
    const amountInUSD =
      txData.currency.symbol.toLowerCase() === 'sol' ? (Math.trunc(amount * trxToUSD * 100) / 100).toString() : amount;

    return {
      to,
      from,
      amount,
      amountInUSD,
      txId: txData.transaction.transactionIndex,
      direction,
      type: txData.currency.tokenType,
      tokenName: txData.currency.symbol,
      timestamp: new Date(txData.any).getTime(),
      fee: txData.transaction.fee,
      status: txData.transaction.success,
      tokenLogo,
    };
  }
}
