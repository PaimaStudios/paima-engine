// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../test-lib/cheatcodes.sol";
import "../test-lib/console.sol";
import "../test-lib/ctest.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC4906Agnostic} from "../contracts/token/IERC4906Agnostic.sol";
import {InverseBaseProjected1155} from "../contracts/token/InverseBaseProjected1155.sol";
import {IInverseBaseProjected1155} from "../contracts/token/IInverseBaseProjected1155.sol";
import {IInverseProjected1155} from "../contracts/token/IInverseProjected1155.sol";
import {IUri} from "../contracts/token/IUri.sol";

contract MockTokenUri is IUri {
    using Strings for uint256;

    function uri(uint256 id) external view override returns (string memory) {
        return string.concat("mock://", id.toString());
    }
}

contract InverseBaseProjected1155Test is CTest, ERC1155Holder {
    using Strings for uint256;

    CheatCodes vm = CheatCodes(HEVM_ADDRESS);
    InverseBaseProjected1155 public token;
    uint256 ownedTokenId;
    string baseURI = "192.168.0.1/";
    address alice = 0x078D888E40faAe0f32594342c85940AF3949E666;

    function setUp() public {
        token = new InverseBaseProjected1155("ABC", "XYZ", address(this));
        ownedTokenId = token.mint(1000, bytes(""), "");
        token.setBaseURI(baseURI);
    }

    function test_CanBurn() public {
        uint256 amount = token.balanceOf(address(this), ownedTokenId);
        token.burn(ownedTokenId, amount);
    }

    function test_CanBurnBatch() public {
        uint256 balance = token.balanceOf(address(this), ownedTokenId);

        uint256[] memory ids = new uint256[](2);
        ids[0] = ownedTokenId;
        ids[1] = ownedTokenId;
        uint256[] memory values = new uint256[](2);
        values[0] = balance / 2;
        values[1] = balance / 4;

        uint256 balanceBefore = token.balanceOf(address(this), ownedTokenId);
        uint256 supplyBefore = token.totalSupply(ownedTokenId);
        vm.expectEmit(true, true, true, true);
        emit IERC1155.TransferBatch(address(this), address(this), address(0), ids, values);
        token.burnBatch(ids, values);

        assertEq(
            token.balanceOf(address(this), ownedTokenId),
            balanceBefore - values[0] - values[1]
        );
        assertEq(token.totalSupply(ownedTokenId), supplyBefore - values[0] - values[1]);
    }

    function test_CanMint() public {
        address minter = alice;
        uint256 tokenId = token.currentTokenId();
        uint256 value = 500;
        uint256 tokenValueUserBefore = token.balanceOf(minter, tokenId);

        vm.prank(minter);
        vm.expectEmit(true, true, true, true);
        emit IInverseBaseProjected1155.Minted(tokenId, value, "abcd");
        token.mint(value, bytes(""), "abcd");

        assertEq(token.balanceOf(minter, tokenId), tokenValueUserBefore + value);
    }

    function test_CanTransfer() public {
        address sender = address(this);
        address recipient = alice;

        uint256 tokenValueMinterBefore = token.balanceOf(sender, ownedTokenId);
        uint256 tokenValueRecipientBefore = token.balanceOf(recipient, ownedTokenId);
        uint256 value = tokenValueMinterBefore - 100;

        token.safeTransferFrom(sender, recipient, ownedTokenId, value, bytes(""));

        assertEq(token.balanceOf(sender, ownedTokenId), tokenValueMinterBefore - value);
        assertEq(token.balanceOf(recipient, ownedTokenId), tokenValueRecipientBefore + value);
    }

    function test_TokenUriUsesBaseUriByDefault() public {
        uint256 value = 1000;
        uint256 tokenId = token.mint(value, bytes(""), "");
        string memory result = token.uri(tokenId);
        assertEq(
            result,
            string.concat(
                baseURI,
                "eip155:",
                block.chainid.toString(),
                "/",
                tokenId.toString(),
                ".json"
            )
        );
    }

    function test_TokenUriUsingCustomBaseUri() public {
        uint256 value = 1000;
        uint256 tokenId = token.mint(value, bytes(""), "");
        string memory customUri = "1.1.0.0/";
        string memory result = token.uri(tokenId, customUri);
        assertEq(
            result,
            string.concat(
                customUri,
                "eip155:",
                block.chainid.toString(),
                "/",
                tokenId.toString(),
                ".json"
            )
        );
    }

    function test_TokenUriUsingCustomUriInterface() public {
        IUri tokenUriInterface = new MockTokenUri();
        string memory result = token.uri(ownedTokenId, tokenUriInterface);
        assertEq(result, string.concat("mock://", ownedTokenId.toString()));
    }

    function test_SupportsInterface() public {
        assertTrue(token.supportsInterface(type(IERC165).interfaceId));
        assertTrue(token.supportsInterface(type(IERC1155).interfaceId));
        assertTrue(token.supportsInterface(type(IInverseProjected1155).interfaceId));
        assertTrue(token.supportsInterface(type(IInverseBaseProjected1155).interfaceId));
    }

    function test_UpdateMetadataEmitsEvent() public {
        uint256 tokenId = 1;
        vm.expectEmit(true, true, true, true);
        emit IERC4906Agnostic.MetadataUpdate(tokenId);
        token.updateMetadata(tokenId);
    }

    function test_UpdateMetadataBatchEmitsEvent() public {
        uint256 fromTokenId = 1;
        uint256 toTokenId = 10;
        vm.expectEmit(true, true, true, true);
        emit IERC4906Agnostic.BatchMetadataUpdate(fromTokenId, toTokenId);
        token.updateMetadataBatch(fromTokenId, toTokenId);
    }

    function test_CannotSetBaseUriUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        token.setBaseURI("test");
    }

    function test_CannotSetBaseExtensionUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        token.setBaseExtension("test");
    }
}
