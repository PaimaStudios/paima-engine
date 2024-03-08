// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IInverseProjectedNft} from "./IInverseProjectedNft.sol";

/// @dev A standard ERC721 that accepts calldata in the mint function for any initialization data needed in a Paima dApp.
interface IInverseBaseProjectedNft is IInverseProjectedNft {
    /// @dev Emitted when the globally-enforced tokenId, and `initialData` provided in the `mint` function parameters.
    event Minted(uint256 indexed tokenId, string initialData);

    /// @dev Mints a new token to address `_to`, passing `initialData` to be emitted in the event.
    /// Increases the `totalSupply` and `currentTokenId`.
    /// Reverts if `totalSupply` is not less than `maxSupply` or if `_to` is a zero address.
    /// Emits the `Minted` event.
    function mint(address _to, string calldata initialData) external returns (uint256);
}
