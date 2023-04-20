//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../NftSale.sol";

/// @dev For testing upgradeability.
contract NftSaleUpgradeDev is NftSale {
    function version() public pure returns (uint8) {
        return 2;
    }
}
