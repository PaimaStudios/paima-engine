// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";

/// @dev A super simple contract to keep track of user payments to batchers.
contract BatcherPayment {
    using Address for address payable;

    /// @dev Emitted to keep track of user payments of native tokens to any given batcher
    event Payment(address indexed userAddress, address indexed batcherAddress, uint256 value);

    /// @dev Emitted when a batcher withdraws funds accumulated to them
    event FundsWithdrawn(address indexed batcherAddress, uint256 amount);

    mapping(address => uint256) public balance;

    /// @dev Emits the `Payment` event, logging the `msg.sender`, `batcherAddress`, and `msg.value`.
    function payBatcher(address batcherAddress) public payable {
        balance[batcherAddress] += msg.value;
        emit Payment(msg.sender, batcherAddress, msg.value);
    }

    /// @dev Withdraws the accumulated funds to the batcher.
    /// Callable by only batcher
    function withdrawFunds() public {
        uint256 amount = balance[msg.sender];
        require(amount > 0, "No funds to withdraw");
        balance[msg.sender] = 0;
        payable(msg.sender).sendValue(amount);
        emit FundsWithdrawn(msg.sender, amount);
    }
}
