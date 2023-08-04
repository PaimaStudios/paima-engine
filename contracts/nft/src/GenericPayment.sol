pragma solidity ^0.8.13;

import "./ERC1967.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract GenericPayment is ERC1967, Ownable {
    bool public initialized;

    using Address for address payable;

    event Initialized(address indexed owner);

    event Pay(
        uint256 amount,
        address payer,
        string message
    );

    function initialize(address owner) public {
        require(!initialized, "Contract already initialized");
        initialized = true;

        _transferOwnership(owner);

        emit Initialized(owner);
    }

    function pay(
        string memory message
    ) external payable {
        emit Pay(msg.value, msg.sender, message);
    }

    function withdraw(address payable _account) external onlyOwner {
        uint256 balance = address(this).balance;

        require(balance > 0, "GenericPayment: 0 balance");
        _account.sendValue(balance);
    }

    function upgradeContract(address _newContract) external onlyOwner {
        _setImplementation(_newContract);
    }

    receive() external payable {}
}
