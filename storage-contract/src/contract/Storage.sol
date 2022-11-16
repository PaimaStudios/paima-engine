// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Storage {
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

  function createLobby(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function joinLobby(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitMoves(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function setNft(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput1(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput2(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput3(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput4(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput5(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput6(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput7(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput8(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput9(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function submitAuxiliaryGameInput10(bytes memory data) public payable {
    paimaSubmitGameInput(data);
  }

  function withdrawFunds() public {
    require(msg.sender == owner, 'Only owner can withdraw funds');
    address payable to = payable(owner);
    uint256 balance = address(this).balance;
    to.transfer(balance);
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
