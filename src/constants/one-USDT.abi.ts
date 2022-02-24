export const oneUSDTAbi = [
  {
    "type": "constructor",
    "payable": false,
    "inputs": [
      {
        "name": "_ethTokenAddr",
        "type": "address",
        "internalType": "address"
      },
      {
        "type": "string",
        "name": "name",
        "internalType": "string"
      },
      {
        "type": "string",
        "name": "symbol",
        "internalType": "string"
      },
      {
        "name": "decimals",
        "internalType": "uint8",
        "type": "uint8"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address",
        "indexed": true
      },
      {
        "name": "spender",
        "indexed": true,
        "type": "address",
        "internalType": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "type": "uint256",
        "name": "value"
      }
    ],
    "anonymous": false
  },
  {
    "inputs": [
      {
        "type": "address",
        "indexed": true,
        "name": "account",
        "internalType": "address"
      }
    ],
    "anonymous": false,
    "name": "MinterAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "type": "event",
    "inputs": [
      {
        "type": "address",
        "name": "account",
        "internalType": "address",
        "indexed": true
      }
    ],
    "name": "MinterRemoved"
  },
  {
    "type": "event",
    "name": "Transfer",
    "inputs": [
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "indexed": false,
        "name": "value",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "outputs": [],
    "name": "addMinter",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "payable": false,
    "type": "function",
    "constant": false
  },
  {
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "name": "allowance",
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "type": "address",
        "name": "spender",
        "internalType": "address"
      }
    ],
    "stateMutability": "view",
    "payable": false,
    "constant": true,
    "type": "function"
  },
  {
    "outputs": [
      {
        "name": "",
        "internalType": "bool",
        "type": "bool"
      }
    ],
    "name": "approve",
    "constant": false,
    "payable": false,
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "name": "amount",
        "internalType": "uint256",
        "type": "uint256"
      }
    ]
  },
  {
    "constant": true,
    "type": "function",
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "name": "balanceOf",
    "inputs": [
      {
        "type": "address",
        "name": "account",
        "internalType": "address"
      }
    ],
    "stateMutability": "view",
    "payable": false
  },
  {
    "payable": false,
    "name": "burn",
    "type": "function",
    "stateMutability": "nonpayable",
    "outputs": [],
    "constant": false,
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ]
  },
  {
    "payable": false,
    "inputs": [
      {
        "type": "address",
        "name": "account",
        "internalType": "address"
      },
      {
        "internalType": "uint256",
        "type": "uint256",
        "name": "amount"
      }
    ],
    "constant": false,
    "name": "burnFrom",
    "stateMutability": "nonpayable",
    "type": "function",
    "outputs": []
  },
  {
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "internalType": "uint8",
        "type": "uint8",
        "name": ""
      }
    ],
    "name": "decimals",
    "payable": false,
    "constant": true
  },
  {
    "payable": false,
    "outputs": [
      {
        "type": "bool",
        "name": "",
        "internalType": "bool"
      }
    ],
    "type": "function",
    "constant": false,
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "type": "uint256",
        "name": "subtractedValue",
        "internalType": "uint256"
      }
    ],
    "name": "decreaseAllowance"
  },
  {
    "constant": true,
    "stateMutability": "view",
    "outputs": [
      {
        "type": "address",
        "name": "",
        "internalType": "address"
      }
    ],
    "name": "ethTokenAddr",
    "type": "function",
    "payable": false,
    "inputs": []
  },
  {
    "stateMutability": "nonpayable",
    "name": "increaseAllowance",
    "type": "function",
    "constant": false,
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "spender",
        "internalType": "address"
      },
      {
        "name": "addedValue",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "payable": false
  },
  {
    "type": "function",
    "outputs": [
      {
        "type": "bool",
        "internalType": "bool",
        "name": ""
      }
    ],
    "stateMutability": "view",
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "payable": false,
    "name": "isMinter"
  },
  {
    "constant": false,
    "type": "function",
    "name": "mint",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "type": "uint256",
        "internalType": "uint256",
        "name": "amount"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ]
  },
  {
    "outputs": [
      {
        "type": "string",
        "name": "",
        "internalType": "string"
      }
    ],
    "name": "name",
    "type": "function",
    "stateMutability": "view",
    "inputs": [],
    "payable": false,
    "constant": true
  },
  {
    "stateMutability": "nonpayable",
    "name": "renounceMinter",
    "inputs": [],
    "type": "function",
    "constant": false,
    "payable": false,
    "outputs": []
  },
  {
    "constant": true,
    "type": "function",
    "payable": false,
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "inputs": [],
    "stateMutability": "view"
  },
  {
    "stateMutability": "view",
    "name": "totalSupply",
    "type": "function",
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "constant": true,
    "inputs": [],
    "payable": false
  },
  {
    "stateMutability": "nonpayable",
    "outputs": [
      {
        "type": "bool",
        "internalType": "bool",
        "name": ""
      }
    ],
    "inputs": [
      {
        "name": "recipient",
        "internalType": "address",
        "type": "address"
      },
      {
        "name": "amount",
        "internalType": "uint256",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "constant": false,
    "type": "function",
    "payable": false
  },
  {
    "constant": false,
    "outputs": [
      {
        "type": "bool",
        "name": "",
        "internalType": "bool"
      }
    ],
    "inputs": [
      {
        "type": "address",
        "name": "sender",
        "internalType": "address"
      },
      {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount",
        "internalType": "uint256",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "name": "transferFrom",
    "payable": false,
    "type": "function"
  }
]