// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IInverseProjectedNft} from "./IInverseProjectedNft.sol";

/// @dev A Paima Inverse Projection NFT where initialization is handled by the base-layer.
/// A standard ERC721 that accepts calldata in the mint function for any initialization data needed in a Paima dApp.
interface IInverseBaseProjectedNft is IInverseProjectedNft {
    /// @dev Emitted when the globally-enforced tokenId is minted, with `initialData` provided in the `mint` function parameters.
    event Minted(uint256 indexed tokenId, string initialData);

    /// @dev Mints a new token to address `_to`, passing `initialData` to be emitted in the event.
    /// Increases the `totalSupply` and `currentTokenId`.
    /// Reverts if `_to` is a zero address or if it refers to smart contract but does not implement IERC721Receiver-onERC721Received.
    /// Emits the `Minted` event.
    function mint(address _to, string calldata initialData) external returns (uint256);
}
