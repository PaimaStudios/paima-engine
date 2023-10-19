// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "../NativeNftSale.sol";
import "./UpgradeDev.sol";

/// @dev For testing upgradeability.
contract NativeNftSaleUpgradeDev is UpgradeDev, NativeNftSale {

}
