// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/NftSale.sol";
import "../src/Nft.sol";
import "../src/Proxy/Proxy.sol";
import "../src/dev/Erc20Dev.sol";
import "../src/dev/NftSaleUpgradeDev.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract NftSaleTest is Test {
    NftSale public nftSaleContractLogic;
    NftSale public nftSaleContract;
    Nft public nftContract;
    NftSaleUpgradeDev public nftSaleUpgradeDev;
    Proxy public nftSaleProxy;
    Erc20Dev[] public currencies;
    ERC20 public randomToken;
    address public nftSaleAdmin;
    address public randomAccount;
    address public wallet;
    uint256 public nftPrice;

    function setUp() public {
        nftPrice = 10e18;
        nftSaleAdmin = 0xc62661BAe6E8346725305318476521E87977E371;
        randomAccount = 0x7BA9100BF4C3fEdb2ccAE86609b17b12DE62860b;
        wallet = 0x4781e93cB1487f81d767B5fce6fE6A2DdF5a05db;

        currencies.push(new Erc20Dev());
        currencies.push(new Erc20Dev());
        currencies.push(new Erc20Dev());
        randomToken = new Erc20Dev();

        ERC20[] memory currenciesMem = new ERC20[](3);
        currenciesMem[0] = ERC20(currencies[0]);
        currenciesMem[1] = ERC20(currencies[1]);
        currenciesMem[2] = ERC20(currencies[2]);

        nftContract = new Nft("MyNft", "MN", 1000, address(this));

        nftSaleContractLogic = new NftSale();

        nftSaleProxy = new Proxy(
            address(nftSaleContractLogic),
            currenciesMem,
            nftSaleAdmin,
            address(nftContract),
            nftPrice
        );

        nftSaleContract = NftSale(address(nftSaleProxy));

        nftContract.setMinter(address(nftSaleContract));
    }

    function mintTokensAndApprove(
        address to,
        uint256 amount,
        bool approve
    ) public {
        currencies[0].mint(to, amount);
        currencies[1].mint(to, amount);
        currencies[2].mint(to, amount);

        ERC20[] memory tokens = castCurrenciesToTokens();

        if (approve)
            setApproval(
                address(nftSaleContract),
                nftPrice,
                tokens,
                randomAccount
            );
    }

    function isValidToken(ERC20 token) public view returns (bool) {
        if (
            token == ERC20(currencies[0]) ||
            token == ERC20(currencies[1]) ||
            token == ERC20(currencies[2])
        ) return true;

        return false;
    }

    function castCurrenciesToTokens()
        public
        view
        returns (ERC20[] memory tokens)
    {
        uint256 size = currencies.length;

        tokens = new ERC20[](size);
        tokens[0] = ERC20(currencies[0]);
        tokens[1] = ERC20(currencies[1]);
        tokens[2] = ERC20(currencies[2]);
    }

    function setApproval(
        address spender,
        uint256 amount,
        ERC20[] memory tokens,
        address signer
    ) public {
        vm.startPrank(signer);
        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].approve(spender, amount);
        }
        vm.stopPrank();
    }

    function currency(uint256 index) public view returns (ERC20) {
        require(index < 3, "NftSaleTest: index out of bounds");
        return ERC20(currencies[index]);
    }

    function test00_contractIsCorrectlyInitialized() public {
        assert(nftSaleContract.tokenIsWhitelisted(currency(0)));
        assert(nftSaleContract.tokenIsWhitelisted(currency(1)));
        assert(nftSaleContract.tokenIsWhitelisted(currency(2)));
    }

    function test01_AccountCanBuyNFTWithToken(uint256 index) public {
        if (index > 2) return;

        mintTokensAndApprove(randomAccount, 10000e18, true);
        ERC20 token = currencies[index];

        uint256 purchasePrice = nftPrice;
        uint256 userTokenBalanceBeforePurchase = token.balanceOf(randomAccount);

        vm.prank(randomAccount);
        uint256 tokenId = nftSaleContract.buyWithToken(token, randomAccount);

        assertEq(nftContract.ownerOf(tokenId), randomAccount);
        assertEq(
            token.balanceOf(randomAccount),
            userTokenBalanceBeforePurchase - purchasePrice
        );
        assertEq(token.balanceOf(address(nftSaleContract)), purchasePrice);
    }

    function test02_failToBuyNFTWithUnallowedToken(ERC20 invalidToken) public {
        if (isValidToken(invalidToken)) return;

        vm.expectRevert("NftSale: token not whitelisted");
        vm.prank(randomAccount);
        nftSaleContract.buyWithToken(invalidToken, msg.sender);
    }

    function test03_failToBuyNFTIfApprovalNotSet() public {
        mintTokensAndApprove(randomAccount, 10000e18, false);

        vm.expectRevert("ERC20: insufficient allowance");
        vm.prank(randomAccount);
        nftSaleContract.buyWithToken(ERC20(currencies[0]), msg.sender);
    }

    function test04_AdminCanUpdatePrice() external {
        uint256 newNftPrice = 5e18;
        vm.prank(nftSaleAdmin);

        nftSaleContract.updatePrice(newNftPrice);
        assertEq(nftSaleContract.nftPrice(), newNftPrice);
    }

    function test06_CannotUpdatePricesIfNotAdmin(address account) public {
        if (account == nftSaleAdmin) return;

        vm.expectRevert("Ownable: caller is not the owner");
        nftSaleContract.updatePrice(nftPrice);
    }

    function test07_AdminCanWithdrawFunds() public {
        mintTokensAndApprove(randomAccount, 1000e18, true);

        vm.startPrank(randomAccount);

        uint256 tokenId = nftSaleContract.buyWithToken(
            currency(0),
            randomAccount
        );
        uint256 purchasePrice = nftSaleContract.nftPrice();
        assertEq(nftContract.ownerOf(tokenId), randomAccount);

        tokenId = nftSaleContract.buyWithToken(currency(1), randomAccount);
        assertEq(nftContract.ownerOf(tokenId), randomAccount);

        tokenId = nftSaleContract.buyWithToken(currency(2), randomAccount);
        assertEq(nftContract.ownerOf(tokenId), randomAccount);

        vm.stopPrank();

        vm.prank(nftSaleAdmin);
        nftSaleContract.withdraw(wallet);

        assertEq(currency(0).balanceOf(address(nftSaleContract)), 0);
        assertEq(currency(0).balanceOf(wallet), purchasePrice);
        assertEq(currency(1).balanceOf(address(nftSaleContract)), 0);
        assertEq(currency(1).balanceOf(wallet), purchasePrice);
        assertEq(currency(2).balanceOf(address(nftSaleContract)), 0);
        assertEq(currency(2).balanceOf(wallet), purchasePrice);
        assertEq(nftSaleContract.getDepositedCurrencies().length, 0);
    }

    function test09_NonAdminCannotWithdrawFunds(address account) public {
        if (account == nftSaleAdmin) return;

        vm.prank(account);
        vm.expectRevert("Ownable: caller is not the owner");
        nftSaleContract.withdraw(account);
    }

    function newSaleContractUpgrade(address signer)
        public
        returns (NftSaleUpgradeDev)
    {
        NftSaleUpgradeDev newNftSaleLogic = new NftSaleUpgradeDev();
        vm.prank(signer);
        nftSaleContract.upgradeContract(address(newNftSaleLogic));

        return newNftSaleLogic;
    }

    function test10_AdminCanUpgradeNftSaleContract() public {
        newSaleContractUpgrade(nftSaleAdmin);

        NftSaleUpgradeDev newNftSaleContract = NftSaleUpgradeDev(
            address(nftSaleProxy)
        );

        assertEq(newNftSaleContract.version(), 2);
    }

    function test11_AdminCanWhitelistTokens(ERC20[] memory tokens) external {
        ERC20[] memory tokens = new ERC20[](3);
        tokens[0] = ERC20(new Erc20Dev());
        tokens[1] = ERC20(new Erc20Dev());
        tokens[2] = ERC20(new Erc20Dev());

        for (uint256 i = 0; i < tokens.length; i++) {
            assertEq(nftSaleContract.tokenIsWhitelisted(tokens[i]), false);
        }

        vm.prank(nftSaleAdmin);

        nftSaleContract.whitelistTokens(tokens);

        for (uint256 i = 0; i < tokens.length; i++) {
            assertEq(nftSaleContract.tokenIsWhitelisted(tokens[i]), true);
        }

        assertEq(
            nftSaleContract.getSupportedCurrencies().length,
            currencies.length + tokens.length
        );
    }

    function test12_AdminCanRemoveWhitelistedToken() external {
        vm.prank(nftSaleAdmin);
        nftSaleContract.removeWhitelistedToken(currency(0));

        assertEq(nftSaleContract.tokenIsWhitelisted(currency(0)), false);
        assertEq(
            nftSaleContract.getSupportedCurrencies().length,
            currencies.length - 1
        );
    }

    function test13_FailToRemoveTokenIfNotWhitelisted(ERC20 token) external {
        vm.assume(!nftSaleContract.tokenIsWhitelisted(token));
        vm.expectRevert("NftSale: token not whitelisted");

        vm.prank(nftSaleAdmin);
        nftSaleContract.removeWhitelistedToken(token);
    }

    function test14_NonAdminsCannotWhitelistTokens(ERC20[] memory tokens)
        external
    {
        vm.expectRevert("Ownable: caller is not the owner");
        nftSaleContract.whitelistTokens(tokens);
    }
}
