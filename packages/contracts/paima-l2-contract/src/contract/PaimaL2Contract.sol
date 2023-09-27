// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@openzeppelin/contracts/utils/Address.sol';

contract PaimaL2Contract {
  using Address for address payable;

  event PaimaGameInteraction(address indexed userAddress, bytes data, uint256 value);

  address public owner;
  uint256 public fee;
  mapping(address => uint256) public latestStoreHeight;

  constructor(address _owner, uint256 _fee) {
    owner = _owner;
    fee = _fee;
  }

  function paimaSubmitGameInput(bytes memory data) public payable {
    require(msg.value >= fee, 'Sufficient funds required to submit game input');
    latestStoreHeight[msg.sender] = block.number;
    emit PaimaGameInteraction(msg.sender, data, msg.value);
  }

  function withdrawFunds() public {
    require(msg.sender == owner, 'Only owner can withdraw funds');
    address payable to = payable(owner);
    uint256 balance = address(this).balance;
    to.sendValue(balance);
  }

  function setOwner(address newOwner) public {
    require(msg.sender == owner, 'Only owner can change owner');
    owner = newOwner;
  }

  function setFee(uint256 newFee) public {
    require(msg.sender == owner, 'Only owner can change fee');
    fee = newFee;
  }
}
