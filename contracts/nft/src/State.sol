// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract State {
    // Price of NFT
    uint256 public nftPrice;

    bool public initialized;

    // NFT address
    address public nftAddress;

    // Array of deposited currencies
    ERC20[] public depositedCurrencies;

    // mapping from token address to amount
    mapping(ERC20 => bool) public depositedCurrenciesMap;

    // Array of supported currencies
    ERC20[] public supportedCurrencies;
}
