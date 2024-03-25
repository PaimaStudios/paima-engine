// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IInverseProjected1155} from "./IInverseProjected1155.sol";
import {IInverseBaseProjected1155} from "./IInverseBaseProjected1155.sol";
import {IERC4906Agnostic} from "./IERC4906Agnostic.sol";

/// @dev A Paima Inverse Projection ERC1155 token where initialization is handled by the base-layer.
/// A standard ERC1155 that accepts calldata in the mint function for any initialization data needed in a Paima dApp.
contract InverseBaseProjected1155 is IInverseBaseProjected1155, ERC1155Supply, Ownable {
    using Strings for uint256;

    string public name;
    string public symbol;

    /// @dev The token ID that will be minted when calling the `mint` function.
    uint256 public currentTokenId;
    /// @dev Base URI that is used in the `uri` function to form the start of the token URI.
    string public baseURI;
    /// @dev Base extension that is used in the `uri` function to form the end of the token URI.
    string public baseExtension;

    /// @dev Sets the NFT's `name`, `symbol`, and transfers ownership to `owner`.
    /// Also sets `currentTokenId` to 1.
    constructor(
        string memory _name,
        string memory _symbol,
        address _owner
    ) ERC1155("") Ownable(_owner) {
        name = _name;
        symbol = _symbol;
        currentTokenId = 1;
    }

    /// @dev Returns true if this contract implements the interface defined by `interfaceId`. See EIP165.
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(IERC165, ERC1155) returns (bool) {
        return
            interfaceId == type(IInverseProjected1155).interfaceId ||
            interfaceId == type(IInverseBaseProjected1155).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /// @dev Mints `value` of a new token to transaction sender, passing `initialData` to be emitted in the event.
    /// Increases the `currentTokenId`.
    /// Reverts if transaction sender is a smart contract that does not implement IERC1155Receiver-onERC1155Received.
    /// Emits the `Minted` event.
    /// Returns the id of the minted token.
    function mint(
        uint256 value,
        bytes memory data,
        string calldata initialData
    ) external virtual returns (uint256) {
        uint256 tokenId = currentTokenId;
        _mint(msg.sender, tokenId, value, data);

        currentTokenId++;

        emit Minted(tokenId, initialData);
        return tokenId;
    }

    /// @dev Burns `value` amount of token of ID `id` from transaction sender.
    /// Reverts if transaction sender's balance of `id` is less than `value`.
    function burn(uint256 id, uint256 value) external virtual {
        _burn(msg.sender, id, value);
    }

    /// @dev Returns the token URI of specified `id` using the default set base URI.
    function uri(
        uint256 id
    ) public view virtual override(ERC1155, IERC1155MetadataURI) returns (string memory) {
        return uri(id, baseURI);
    }

    /// @dev Returns the token URI of specified `id` using a custom base URI.
    function uri(
        uint256 id,
        string memory customBaseUri
    ) public view virtual returns (string memory) {
        require(exists(id), "InverseBaseProjected1155: URI query for nonexistent token");
        string memory URI = bytes(customBaseUri).length > 0
            ? string.concat(customBaseUri, id.toString())
            : "";
        return string(abi.encodePacked(URI, baseExtension));
    }

    /// @dev Sets `_URI` as the `baseURI` of the NFT.
    /// Callable only by the contract owner.
    /// Emits the `SetBaseURI` event.
    function setBaseURI(string memory _URI) external virtual onlyOwner {
        string memory oldURI = baseURI;
        baseURI = _URI;
        emit SetBaseURI(oldURI, _URI);
    }

    /// @dev Sets `_newBaseExtension` as the `baseExtension` of the NFT.
    /// Callable only by the contract owner.
    function setBaseExtension(string memory _newBaseExtension) public virtual onlyOwner {
        string memory oldBaseExtension = baseExtension;
        baseExtension = _newBaseExtension;
        emit SetBaseURI(oldBaseExtension, _newBaseExtension);
    }

    /// @dev Function that emits an event to notify third-parties (e.g. NFT marketplaces) about
    /// an update to consecutive range of tokens. Can be overriden in inheriting contract.
    function updateMetadataBatch(uint256 _fromTokenId, uint256 _toTokenId) public virtual {
        emit BatchMetadataUpdate(_fromTokenId, _toTokenId);
    }

    /// @dev Function that emits an event to notify third-parties (e.g. NFT marketplaces) about
    /// an update to a single token. Can be overriden in inheriting contract.
    function updateMetadata(uint256 _tokenId) public virtual {
        emit MetadataUpdate(_tokenId);
    }
}
