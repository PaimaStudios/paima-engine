// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "../test-lib/cheatcodes.sol";
import "../test-lib/console.sol";
import "../test-lib/ctest.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {InverseAppProjectedNft} from "../contracts/token/InverseAppProjectedNft.sol";
import {IInverseAppProjectedNft} from "../contracts/token/IInverseAppProjectedNft.sol";
import {ITokenUri} from "../contracts/token/ITokenUri.sol";

contract MockTokenUri is ITokenUri {
    using Strings for uint256;

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        return string.concat("mock://", tokenId.toString());
    }
}

contract InverseAppProjectedNftTest is CTest, ERC721Holder {
    using Strings for uint256;

    CheatCodes vm = CheatCodes(HEVM_ADDRESS);
    InverseAppProjectedNft public nft;
    uint256 ownedTokenId;
    string baseURI = "192.168.0.1/";
    address alice = 0x078D888E40faAe0f32594342c85940AF3949E666;

    function setUp() public {
        nft = new InverseAppProjectedNft("ABC", "XYZ", address(this));
        ownedTokenId = nft.mint(address(this));
        nft.setBaseURI(baseURI);
    }

    function test_CanBurn() public {
        nft.burn(ownedTokenId);
    }

    function test_CanMint() public {
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit IInverseAppProjectedNft.Minted(2, address(this), 2);
        nft.mint(address(this));
    }

    function test_CanTransfer() public {
        nft.transferFrom(address(this), alice, ownedTokenId);
    }

    function test_TokenUriUsesBaseUriByDefault() public {
        string memory result = nft.tokenURI(ownedTokenId);
        assertEq(
            result,
            string.concat(
                "192.168.0.1/eip155:31337/",
                Strings.toHexString(uint160(address(this)), 20),
                "/",
                "1.json"
            )
        );
    }

    function test_TokenUriUsingCustomBaseUri() public {
        string memory result = nft.tokenURI(ownedTokenId, "1.1.0.0/");
        assertEq(
            result,
            string.concat(
                "1.1.0.0/eip155:31337/",
                Strings.toHexString(uint160(address(this)), 20),
                "/",
                "1.json"
            )
        );
    }

    function test_TokenUriUsingCustomUriInterface() public {
        ITokenUri tokenUriInterface = new MockTokenUri();
        string memory result = nft.tokenURI(ownedTokenId, tokenUriInterface);
        assertEq(result, string.concat("mock://", ownedTokenId.toString()));
    }

    function test_SupportsInterface() public {
        assertTrue(nft.supportsInterface(type(IERC165).interfaceId));
        assertTrue(nft.supportsInterface(type(IERC721).interfaceId));
        assertTrue(nft.supportsInterface(bytes4(0x49064906)));
    }

    function test_UpdateMetadataEmitsEvent() public {
        uint256 tokenId = 1;
        vm.expectEmit(true, true, true, true);
        emit IERC4906.MetadataUpdate(tokenId);
        nft.updateMetadata(tokenId);
    }

    function test_UpdateMetadataBatchEmitsEvent() public {
        uint256 fromTokenId = 1;
        uint256 toTokenId = 10;
        vm.expectEmit(true, true, true, true);
        emit IERC4906.BatchMetadataUpdate(fromTokenId, toTokenId);
        nft.updateMetadataBatch(fromTokenId, toTokenId);
    }

    function test_CannotMintToZeroAddress() public {
        vm.expectRevert("InverseAppProjectedNft: zero receiver address");
        nft.mint(address(0));
    }

    function test_CannotBurnUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert("InverseAppProjectedNft: not owner");
        nft.burn(ownedTokenId);
    }

    function test_CannotSetBaseUriUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        nft.setBaseURI("test");
    }

    function test_CannotSetBaseExtensionUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        nft.setBaseExtension("test");
    }
}
