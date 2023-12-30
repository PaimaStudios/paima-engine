// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BaseState {
    // Price of NFT
    uint256 public nftPrice;

    bool public initialized;

    // NFT address
    address public nftAddress;
}
