# Account Abstraction 4337 Example

Mnimal bundler node that is capable of accepting ERC-4337 UserOperations, execute them on supported chain and return the transaction hash in response.

# before run the project you will need create a .env file and add the fallowing variables
- PRIVATE_KEY (your wallet private key)
- ALCHEMY_API_KEY (alchemy node api key)


# How run the API
`npm i`
`npx tsc`
`node dist/src/index.js`

# API endpoint
localhost:3000/api/sendUserOp

```{
  "jsonrpc": "2.0",
  "method": "eth_sendUserOperation",
  "params": [{
    "ops": [{
      "sender": "0xD0aFb575CB9f44529A65679Fd3F480F265e5A289",
      "nonce": 1,
      "callData": "0x72b3b6200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000056464646464000000000000000000000000000000000000000000000000000000",
      "verificationGasAndData": "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f",
      "maxFeePerGas": 10000000000,
      "maxPriorityFeePerGas": 1000000000,
      "paymaster": "0xce41487e69B88485c6a1346C245aFb7411F163D2",
      "signature": "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f"
    }],
    "beneficiary": "0xe12392E42bd36ce2955a91c87AdF03413B73b67c"
  }],
  "id": 1
}
```