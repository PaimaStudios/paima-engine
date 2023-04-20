// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Nft.sol";
import "../src/dev/Erc20Dev.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NftTest is Test {
    using Strings for uint256;

    Nft public nftContract;
    address public nftAdmin;
    string public name;
    string public symbol;
    uint256 public maxSupply;
    address public minter;
    address public randomAccount;
    address public constant ZERO_ADDRESS =
        0x0000000000000000000000000000000000000000;

    function setUp() public {
        name = "MyNFT";
        symbol = "MN";
        maxSupply = 1;

        minter = 0x7BA9100BF4C3fEdb2ccAE86609b17b12DE62860b;
        nftAdmin = 0xc62661BAe6E8346725305318476521E87977E371;
        randomAccount = 0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73;

        nftContract = new Nft(name, symbol, maxSupply, nftAdmin);
    }

    function adminSetup() public {
        vm.startPrank(nftAdmin);
        nftContract.setMinter(minter);
        nftContract.setBaseExtension(".json");
        vm.stopPrank();
    }

    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function setBaseURI(string memory baseURI, address signer) public {
        vm.prank(signer);
        nftContract.setBaseURI(baseURI);
    }

    function preMint(address to) public {
        vm.assume(to != address(0));
        vm.assume(isContract(to) == false);
    }

    function test01_ContractCorrectlyInitialized() public {
        assertEq(nftContract.name(), name);
        assertEq(nftContract.symbol(), symbol);
        assertEq(nftContract.maxSupply(), maxSupply);
        assertEq(nftContract.currentTokenId(), 1);
    }

    function test02_AdminCanSetBaseURI(string memory uri) public {
        vm.prank(nftAdmin);
        nftContract.setBaseURI(uri);

        assertEq(nftContract.baseURI(), uri);
    }

    function test03_NonAdminCannotSetBaseURI(string memory uri, address account)
        public
    {
        vm.assume(account != nftAdmin);
        vm.prank(account);
        vm.expectRevert("Ownable: caller is not the owner");

        nftContract.setBaseURI(uri);
    }

    function test04_AdminCanUpdateMaxSupply(uint256 supply) public {
        vm.assume(supply > nftContract.maxSupply());
        vm.prank(nftAdmin);

        nftContract.updateMaxSupply(supply);
        assertEq(nftContract.maxSupply(), supply);
    }

    function test05_AdminCannotUpdateSupplyIfNewSupplyInvalid(uint256 supply)
        public
    {
        vm.assume(supply <= maxSupply);
        vm.prank(nftAdmin);
        vm.expectRevert("NFT: old supply less than new supply");
        nftContract.updateMaxSupply(supply);
    }

    function test06_NonAdminCannotUpdateSupply(address account) public {
        vm.assume(account != nftAdmin);
        vm.prank(account);
        vm.expectRevert("Ownable: caller is not the owner");

        nftContract.updateMaxSupply(2000);
    }

    function test07_AdminCanSetMinters(
        address _minter_1,
        address _minter_2,
        address _minter_3
    ) public {
        vm.assume(
            _minter_1 != address(0) &&
                _minter_2 != address(0) &&
                _minter_3 != address(0)
        );
        vm.startPrank(nftAdmin);

        nftContract.setMinter(_minter_1);
        nftContract.setMinter(_minter_2);
        nftContract.setMinter(_minter_3);

        assert(nftContract.isMinter(_minter_1));
        assert(nftContract.isMinter(_minter_2));
        assert(nftContract.isMinter(_minter_3));
    }

    function test08_FailsIfNewMinteriSZeroAddress() public {
        vm.prank(nftAdmin);
        vm.expectRevert("Nft: invalid minter");

        nftContract.setMinter(address(0));
    }

    function test9_NonAdminCannotSetMinter(address account) public {
        vm.assume(account != nftAdmin);
        vm.prank(account);
        vm.expectRevert("Ownable: caller is not the owner");
        nftContract.setMinter(account);
    }

    function test10_supportsE1P165Interface() public {
        bytes4 eip165InterfaceId = 0x01ffc9a7;
        assertTrue(nftContract.supportsInterface(eip165InterfaceId));
    }

    function test11_MinterCanMint(address to) public {
        adminSetup();
        preMint(to);

        uint8 currentCategory = nftContract.currentCategory();
        uint256 currentTokenIdBeforeMint = nftContract.currentTokenId();

        vm.prank(minter);
        uint256 tokenId = nftContract.mint(to);

        assertEq(currentCategory, 1);
        assertEq(currentTokenIdBeforeMint, 1);
        assertEq(tokenId, currentTokenIdBeforeMint);
        assertEq(nftContract.totalSupply(), 1);
        assertEq(nftContract.currentTokenId(), 2);
        assertEq(nftContract.tokens(tokenId), currentCategory);
    }

    function test12_CannotMintWhenMaxSupplyIsExceeded(address to) public {
        adminSetup();
        preMint(to);

        assertEq(nftContract.totalSupply(), 0);

        vm.startPrank(minter);
        nftContract.mint(to);

        vm.expectRevert("Nft: max supply reached");
        nftContract.mint(to);

        vm.stopPrank();

        assertEq(nftContract.totalSupply(), 1);
        assertEq(nftContract.maxSupply(), maxSupply);
    }

    function test13_CategoryIsCorrectlyUpdated(address to, uint256 supply)
        public
    {
        vm.assume(supply > maxSupply && supply < 1000);
        adminSetup();
        preMint(to);

        vm.prank(nftAdmin);

        nftContract.updateMaxSupply(supply);

        uint256 maxSupply_ = nftContract.maxSupply();
        assertEq(maxSupply_, supply);
        assertGt(maxSupply_, nftContract.totalSupply());

        uint256 count = supply;
        for (uint256 i = 0; i < count; i++) {
            uint8 currentCategory = nftContract.currentCategory();
            vm.prank(minter);
            uint256 tokenId = nftContract.mint(to);

            assertEq(nftContract.tokens(tokenId), currentCategory);
            assertLt(currentCategory, 5);
        }
    }

    function test14_AccountCanBurnNFT(address to) public {
        adminSetup();
        preMint(to);
        vm.prank(minter);

        uint256 tokenId = nftContract.mint(to);
        assertEq(nftContract.totalSupply(), 1);
        assertEq(nftContract.ownerOf(tokenId), to);
        assertEq(nftContract.balanceOf(to), 1);

        vm.prank(to);
        nftContract.burn(tokenId);
        assertEq(nftContract.balanceOf(to), 0);
        assertFalse(nftContract.exists(tokenId));
        assertEq(nftContract.totalSupply(), 0);
    }

    function test15_CannotBurnNonExistingNFT(uint256 tokenId, address account)
        public
    {
        vm.prank(account);
        vm.expectRevert("Nft: non-existent tokenId");
        nftContract.burn(tokenId);
    }

    function test16_OnlyOwnerCanBurnNFT(address account) public {
        vm.assume(account != randomAccount);
        adminSetup();
        vm.prank(minter);

        uint256 tokenId = nftContract.mint(randomAccount);

        vm.expectRevert("Nft: not owner");
        vm.prank(account);
        nftContract.burn(tokenId);
    }

    function test17_BaseUriIsValid(address to) public {
        string memory uri = "http://fake_uri/";
        vm.prank(nftAdmin);
        nftContract.setBaseURI(uri);
        adminSetup();
        preMint(to);

        vm.prank(minter);
        uint256 tokenId = nftContract.mint(to);

        assertEq(
            nftContract.tokenURI(tokenId),
            string(
                abi.encodePacked(
                    uri,
                    tokenId.toString(),
                    nftContract.baseExtension()
                )
            )
        );
    }
}
