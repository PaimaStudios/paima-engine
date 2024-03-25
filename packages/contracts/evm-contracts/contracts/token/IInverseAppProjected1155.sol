// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IInverseProjected1155} from "./IInverseProjected1155.sol";

/// @dev A Paima Inverse Projection ERC1155 token where initialization is handled by the app-layer.
/// A standard ERC1155 that can be freely minted and stores an unique `<minter, userTokenId>` pair (used in `tokenURI`) when minted.
interface IInverseAppProjected1155 is IInverseProjected1155 {
    /// @dev Emitted when `value` amount of globally-enforced `tokenId` in combination with an unique `<minter, userTokenId>` pair is minted.
    event Minted(
        uint256 indexed tokenId,
        address indexed minter,
        uint256 indexed userTokenId,
        uint256 value
    );

    /// @dev Emitted when supply of globally-enforced `tokenId` in combination with an unique `<minter, userTokenId>` pair goes to zero.
    event BurnedAll(uint256 indexed tokenId, address indexed minter, uint256 indexed userTokenId);

    /// @dev Mints `value` of a new token to the transaction sender.
    /// Increases the `currentTokenId`.
    /// Reverts if transaction sender is a smart contract that does not implement IERC1155Receiver-onERC1155Received.
    /// Emits the `Minted` event.
    /// Returns the id of the minted token.
    function mint(uint256 value, bytes memory data) external returns (uint256);
}
