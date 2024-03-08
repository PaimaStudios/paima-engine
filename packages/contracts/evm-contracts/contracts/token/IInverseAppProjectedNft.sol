// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IInverseProjectedNft} from "./IInverseProjectedNft.sol";

/// @dev A standard ERC721 that accepts calldata in the mint function for any initialization data needed in a Paima dApp.
interface IInverseAppProjectedNft is IInverseProjectedNft {
    /// @dev Emitted when the globally-enforced tokenId as well as the unique <minter, userTokenId> pair.
    event Minted(uint256 indexed tokenId, address indexed minter, uint256 indexed userTokenId);

    /// @dev Mints a new token to address `_to`
    /// Increases the `totalSupply` and `currentTokenId`.
    /// Reverts if `totalSupply` is not less than `maxSupply` or if `_to` is a zero address.
    /// Emits the `Minted` event.
    function mint(address _to) external returns (uint256);
}
