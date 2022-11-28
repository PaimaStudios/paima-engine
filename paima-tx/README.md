# Paima-tx

Paima-tx is a simple library to help build transactions for writing to the Paima Storage Contract.

Both Paima-tx and the Paima Contract are currently implemented to be usable on top of EVM-based blockchains.

## Usage

Currently the library is in development, unpublished, and to be
imported and used locally.

The exported function `getTxTemplate` can be used as follows to help build store data transaction structures to be sent using Metamask:

```ts
import { utf8ToHex, numberToHex } from "web3-utils";
import { getTxTemplate } from "paima-tx";

...

const userAddress = "0x186...a40";
const storageContractAddress = "0x76b...882";
const data = utf8ToHex("Hello!");
const value = 123456;

const txTemplate = getTxTemplate(
  storageContractAddress,
  'paimaSubmitGameInput',
  data
);

const tx = {
  ...txTemplate,
  from: userAddress,
  value: numberToHex(value)
};

return new Promise((res, err) => (window as any).ethereum.request({
  method: "eth_sendTransaction",
  params: [tx]
});
```

## Development

Install dependencies:

```
npm i
```

To test:

```
npm run test
```

Lint:

```
npm run lint
```
