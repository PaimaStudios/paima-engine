pragma solidity ^0.8.7;

import "../ERC1967.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Proxy
/// @dev Proxy contract mostly based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Proxy.sol
contract NativeProxy is ERC1967 {
    /// @dev this is normally not needed as runtime bytecode is deployed in
    /// genesis file and implementation storage slot defined there too
    constructor(
        address implementation,
        address owner,
        address nftAddress,
        uint256 nftPrice
    ) {
        _assertCorrectImplementationSlot();
        _setImplementation(implementation);

        bytes memory data = abi.encodeWithSignature(
            "initialize(address,address,uint256)",
            owner,
            nftAddress,
            nftPrice
        );
        (bool success, ) = implementation.delegatecall(data);
        require(success, "Initialization unsuccessful");
    }

    /// @dev Delegates the current call to `implementation`.
    /// This function does not return to its internal call site, it will return
    /// directly to the external caller.
    function _delegate(address target) internal {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), target, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    function _fallback() internal {
        _delegate(_getImplementation());
    }

    fallback() external payable {
        _fallback();
    }

    receive() external payable {}
}
