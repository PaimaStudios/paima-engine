// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";

/// @dev A standard ERC721 that can be burned and has a special tokenURI function accepting a custom base URI.
interface IInverseProjectedNft is IERC4906 {
    /// @dev Emitted when `baseExtension` is updated from `oldBaseExtension` to `newBaseExtension`.
    event SetBaseExtension(string oldBaseExtension, string newBaseExtension);

    /// @dev Emitted when `baseUri` is updated from `oldUri` to `newUri`.
    event SetBaseURI(string oldUri, string newUri);

    /// @dev Burns token of ID `_tokenId`. Callable only by the owner of the specified token.
    /// Reverts if `_tokenId` is not existing.
    function burn(uint256 _tokenId) external;

    /// @dev Sets `_URI` as the `baseURI` of the NFT.
    /// Callable only by the contract owner.
    /// Emits the `SetBaseURI` event.
    function setBaseURI(string memory _URI) external;

    /// @dev Sets `_newBaseExtension` as the `baseExtension` of the NFT.
    /// Callable only by the contract owner.
    function setBaseExtension(string memory _newBaseExtension) external;

    /// @dev Returns the token URI of specified `tokenId` using a custom base URI.
    function tokenURI(
        uint256 tokenId,
        string memory customBaseUri
    ) external view returns (string memory);
}
