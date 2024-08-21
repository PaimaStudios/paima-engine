// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";

/// @dev The main L2 contract for a Paima L2.
contract PaimaL2Contract {
    using Address for address payable;

    /// @dev Mapping to keep track of user payments to batchers.
    mapping(address => uint256) public balance;

    /// @dev Emitted when `paimaSubmitGameInput` function is called with `data`.
    /// `userAddress` is the transaction sender and `value` is the transaction value.
    event PaimaGameInteraction(address indexed userAddress, bytes data, uint256 value);

    /// @dev Emitted to keep track of user payments of native tokens to any given batcher
    event Payment(address indexed userAddress, address indexed batcherAddress, uint256 value);

    /// @dev Emitted when a batcher withdraws funds accumulated to them
    event FundsWithdrawn(address indexed batcherAddress, uint256 amount);

    /// @dev Contract owner.
    address public owner;
    /// @dev Amount in wei that is required to be paid when calling `paimaSubmitGameInput`.
    uint256 public fee; // in wei

    /// @dev Sets the contract owner to `_owner` and payment fee to `_fee`.
    constructor(address _owner, uint256 _fee) {
        owner = _owner;
        fee = _fee;
    }

    /// @dev Emits the `PaimaGameInteraction` event, logging the `msg.sender`, `data`, and `msg.value`.
    /// Revert if `msg.value` is less than set `fee`.
    function paimaSubmitGameInput(bytes calldata data) public payable {
        require(msg.value >= fee, "Sufficient funds required to submit game input");
        emit PaimaGameInteraction(msg.sender, data, msg.value);
    }

    /// @dev Withdraws the contract balance to the `owner`.
    /// Callable only by the contract owner.
    function withdrawFunds() public {
        require(msg.sender == owner, "Only owner can withdraw funds");
        address payable to = payable(owner);
        uint256 totalBalance = address(this).balance;
        to.sendValue(totalBalance);
    }

    /// @dev Sets the `newOwner` as the contract owner.
    /// Callable only by the contract owner.
    function setOwner(address newOwner) public {
        require(msg.sender == owner, "Only owner can change owner");
        owner = newOwner;
    }

    /// @dev Sets the `newFee` as the required payment fee.
    /// Callable only by the contract owner.
    function setFee(uint256 newFee) public {
        require(msg.sender == owner, "Only owner can change fee");
        fee = newFee;
    }

    /// @dev Emits the `Payment` event, logging the `msg.sender`, `batcherAddress`, and `msg.value`.
    function payBatcher(address batcherAddress) public payable {
        // require(msg.value > 0, "payBatcher requires funds");
        balance[batcherAddress] += msg.value;
        emit Payment(msg.sender, batcherAddress, msg.value);
    }

    /// @dev Emits the `Payment` event, logging the `msg.sender`, `batcherAddress`, and `msg.value`.
    function payBatcherFor(address batcherAddress, address forAddress) public payable {
        // require(msg.value > 0, "payBatcherFor requires funds");
        balance[batcherAddress] += msg.value;
        emit Payment(forAddress, batcherAddress, msg.value);
    }

    /// @dev Withdraws the accumulated funds to the batcher.
    /// Callable by only batcher
    function withdrawBatcherFunds() public {
        uint256 amount = balance[msg.sender];
        require(amount > 0, "No funds to withdraw");
        balance[msg.sender] = 0;
        payable(msg.sender).sendValue(amount);
        emit FundsWithdrawn(msg.sender, amount);
    }
}
