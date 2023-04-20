// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/NativeNftSale.sol";
import "../src/Nft.sol";
import "../src/Proxy/NativeProxy.sol";
import "../src/dev/NativeNftSaleUpgradeDev.sol";

contract NativeNftSaleTest is Test {
    NativeNftSale public nativeNftSaleContractLogic;
    NativeNftSale public nativeNftSaleContract;
    Nft public nftContract;
    NativeNftSaleUpgradeDev public nativeNftSaleUpgradeDev;
    NativeProxy public nativeNftSaleProxy;
    address public nftSaleAdmin;
    address public randomAccount;
    address public wallet;
    uint256 public nftPrice;

    function setUp() public {
        nftPrice = 10e18;
        nftSaleAdmin = 0xc62661BAe6E8346725305318476521E87977E371;
        randomAccount = 0x7BA9100BF4C3fEdb2ccAE86609b17b12DE62860b;
        wallet = 0x4781e93cB1487f81d767B5fce6fE6A2DdF5a05db;

        nftContract = new Nft("MyNft", "MN", 1000, address(this));

        nativeNftSaleContractLogic = new NativeNftSale();

        nativeNftSaleProxy = new NativeProxy(
            address(nativeNftSaleContractLogic),
            nftSaleAdmin,
            address(nftContract),
            nftPrice
        );

        nativeNftSaleContract = NativeNftSale(
            payable(address(nativeNftSaleProxy))
        );

        nftContract.setMinter(address(nativeNftSaleContract));

        vm.deal(randomAccount, 100 ether);
        uint256 balance = randomAccount.balance;

        assertEq(balance, 100 ether);
    }

    function test00_contractIsCorrectlyInitialized() public {
        assertEq(nativeNftSaleContract.nftPrice(), nftPrice);
        assertEq(nativeNftSaleContract.nftAddress(), address(nftContract));
        assertEq(nativeNftSaleContract.owner(), nftSaleAdmin);
        assertEq(nativeNftSaleContract.initialized(), true);
    }

    function test01_AccountCanBuyNFTWithMilkADA() public {
        vm.startPrank(randomAccount);
        uint256 tokenId = nativeNftSaleContract.buyNft{value: nftPrice}(
            randomAccount
        );

        assertEq(tokenId, 1);
        assertEq(address(nativeNftSaleContract).balance, nftPrice);
        assertEq(nftContract.ownerOf(tokenId), randomAccount);
    }

    function test02_FailToBuyIfIncorrectValueIsSent() public {
        vm.expectRevert("NativeNftSale: incorrect value");
        vm.startPrank(randomAccount);

        uint256 tokenId = nativeNftSaleContract.buyNft(randomAccount);
    }

    function test03_AdminCanUpdatePrice() external {
        uint256 newNftPrice = 5e18;
        vm.prank(nftSaleAdmin);

        nativeNftSaleContract.updatePrice(newNftPrice);
        assertEq(nativeNftSaleContract.nftPrice(), newNftPrice);
    }

    function test04_CannotUpdatePricesIfNotAdmin(address account) public {
        if (account == nftSaleAdmin) return;

        vm.expectRevert("Ownable: caller is not the owner");
        nativeNftSaleContract.updatePrice(1e18);
    }

    function test05_AdminCanWithdrawFunds() public {
        vm.prank(randomAccount);
        nativeNftSaleContract.buyNft{value: nftPrice}(randomAccount);

        vm.prank(nftSaleAdmin);
        nativeNftSaleContract.withdraw(wallet);

        assertEq(wallet.balance, nftPrice);
        assertEq(address(nativeNftSaleContract).balance, 0);
    }

    function test06_NonAdminCannotWithdrawFunds() public {
        vm.prank(randomAccount);
        vm.expectRevert("Ownable: caller is not the owner");

        nativeNftSaleContract.withdraw(wallet);
    }
}
