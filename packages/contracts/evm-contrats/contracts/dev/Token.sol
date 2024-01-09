// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 10000000e18);
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
