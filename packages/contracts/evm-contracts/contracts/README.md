# Solidity Contracts

Solidity contracts provided as part of Paima Engine.

Core contracts

<ul>
  <li>[PaimaL2Contract](#PaimaL2Contract): The main L2 contract for a Paima L2.</li>
</ul>
State-annotated contracts
<ul>
  <li>[AnnotatedMintNft](#AnnotatedMintNft): A standard ERC721 that accepts calldata in the mint function for any initialization data needed in a Paima dApp.</li>
  <li>[InverseBaseProjectedNft](#InverseBaseProjectedNft): Project game state into a ERC721 NFT on an EVM layer initiated on said base layer.</li>
  <li>[InverseAppProjectedNft](#InverseAppProjectedNft): Project game state into a ERC721 NFT on an EVM layer initiated on the app layer.</li>
</ul>
Facilitating monetization
<ul>
  <li>[NativeNftSale](#NativeNftSale): Facilitates selling NFTs that accepts extra data when buying for any initialization data needed in a Paima dApp.</li>
  <li>[GenericPayment](#GenericPayment): Facilitates accepting payment that accepts extra data to know what the payment was for inside a Paima dApp.</li>
  <li>[Erc20NftSale](#Erc20NftSale): Facilitates selling NFTs for specific ERC20s that accepts extra data when buying for any initialization data needed in a Paima dApp.</li>
</ul>

## Core contracts

{{PaimaL2Contract}}

## State-annotated contracts

{{AnnotatedMintNft}}

{{IInverseProjectedNft}}
{{IInverseBaseProjectedNft}}
{{InverseBaseProjectedNft}}
{{IInverseAppProjectedNft}}
{{InverseAppProjectedNft}}

## Facilitating monetization

{{NativeNftSale}}

{{GenericPayment}}

{{Erc20NftSale}}

## Utilities

{{BaseState}}

{{State}}

{{ERC1967}}

{{NativeNftSaleProxy}}

{{GenericPaymentProxy}}

{{Erc20NftSaleProxy}}
