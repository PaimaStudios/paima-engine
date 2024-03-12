// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IInverseProjectedNft} from "./IInverseProjectedNft.sol";

/// @dev A Paima Inverse Projection NFT where initialization is handled by the app-layer.
/// A standard ERC721 that can be freely minted and stores an unique <minter, userTokenId> pair (used in tokenURI) when minted.
interface IInverseAppProjectedNft is IInverseProjectedNft {
    /// @dev Emitted when the globally-enforced tokenId in combination with an unique <minter, userTokenId> pair is minted.
    event Minted(uint256 indexed tokenId, address indexed minter, uint256 indexed userTokenId);

    /// @dev Mints a new token to address `_to`
    /// Increases the `totalSupply` and `currentTokenId`.
    /// Reverts if `_to` is a zero address or if it refers to smart contract but does not implement IERC721Receiver-onERC721Received.
    /// Emits the `Minted` event.
    function mint(address _to) external returns (uint256);
}
