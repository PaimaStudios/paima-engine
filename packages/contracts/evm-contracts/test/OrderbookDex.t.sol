// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {CheatCodes} from "../test-lib/cheatcodes.sol";
import {CTest} from "../test-lib/ctest.sol";

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IInverseAppProjected1155} from "../contracts/token/IInverseAppProjected1155.sol";
import {InverseAppProjected1155} from "../contracts/token/InverseAppProjected1155.sol";
import {IOrderbookDex} from "../contracts/orderbook/IOrderbookDex.sol";
import {OrderbookDex} from "../contracts/orderbook/OrderbookDex.sol";

contract OrderbookDexTest is CTest, ERC1155Holder {
    using Address for address payable;

    CheatCodes vm = CheatCodes(HEVM_ADDRESS);
    OrderbookDex public dex;
    IInverseAppProjected1155 asset;
    address alice = vm.addr(uint256(keccak256(abi.encodePacked("alice"))));
    address boris = vm.addr(uint256(keccak256(abi.encodePacked("boris"))));

    function tryToSendEthToDex() public {
        payable(address(dex)).sendValue(1);
    }

    function setUp() public {
        asset = new InverseAppProjected1155("Gold", "GOLD", address(this));
        dex = new OrderbookDex(asset);
        asset.setApprovalForAll(address(dex), true);
        vm.deal(alice, 1_000 ether);
        vm.deal(boris, 1_000 ether);
    }

    function test_SupportsInterface() public {
        assertTrue(dex.supportsInterface(type(IERC165).interfaceId));
        assertTrue(dex.supportsInterface(type(IOrderbookDex).interfaceId));
    }

    function test_CreateOrderSatisfiesRequirements() public {
        uint256 orderId = dex.getSellerOrderId(address(this));
        uint256 assetAmount = 100;
        uint256 pricePerAsset = 200;

        uint256 assetId = asset.mint(assetAmount, "");
        vm.expectEmit(true, true, true, true);
        emit IOrderbookDex.OrderCreated(address(this), orderId, assetAmount, pricePerAsset);
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);
        IOrderbookDex.Order memory order = dex.getOrder(address(this), orderId);
        assertEq(order.assetId, assetId);
        assertEq(order.assetAmount, assetAmount);
        assertEq(order.pricePerAsset, pricePerAsset);
        assertEq(asset.balanceOf(address(dex), assetId), assetAmount);
    }

    function test_CancelOrderSatisfiesRequirements() public {
        uint256 orderId = dex.getSellerOrderId(address(this));
        uint256 assetAmount = 100;
        uint256 assetId = asset.mint(assetAmount, "");
        dex.createSellOrder(assetId, assetAmount, 200);

        vm.expectEmit(true, true, true, true);
        emit IOrderbookDex.OrderCancelled(address(this), orderId);
        dex.cancelSellOrder(orderId);
        IOrderbookDex.Order memory order = dex.getOrder(address(this), orderId);
        assertEq(order.assetAmount, 0);
        assertEq(asset.balanceOf(address(dex), assetId), 0);
        assertEq(asset.balanceOf(address(this), assetId), assetAmount);
    }

    function testFuzz_FillOrdersExactEth(uint256 price) public {
        uint256 ordersCount = 5;
        vm.assume(price / ordersCount > 0);
        vm.assume(price < type(uint256).max / ordersCount);
        uint256[] memory orderIds = new uint256[](ordersCount);
        address payable[] memory sellers = new address payable[](ordersCount);
        uint256 totalAssetAmount;
        address buyer = address(this);
        for (uint256 i = 0; i < ordersCount; i++) {
            address payable seller = payable(vm.addr(uint256(keccak256(abi.encodePacked(i)))));
            uint256 assetAmount = price / (ordersCount - i);
            uint256 orderId = dex.getSellerOrderId(seller);
            uint256 pricePerAsset = price / assetAmount;
            orderIds[i] = orderId;
            sellers[i] = seller;
            vm.startPrank(seller);
            uint256 assetId = asset.mint(assetAmount, "");
            asset.setApprovalForAll(address(dex), true);
            dex.createSellOrder(assetId, assetAmount, pricePerAsset);
            totalAssetAmount += assetAmount;
        }

        {
            vm.deal(buyer, type(uint256).max);
            uint256 buyerBalanceBefore = buyer.balance;
            uint256[] memory sellersBalancesBefore = new uint256[](ordersCount);
            uint256[] memory expectedPayouts = new uint256[](ordersCount);
            uint256[] memory ordersAssetAmounts = new uint256[](ordersCount);
            uint256 totalExpectedPayout;
            for (uint256 i = 0; i < ordersCount; i++) {
                IOrderbookDex.Order memory order = dex.getOrder(sellers[i], orderIds[i]);
                expectedPayouts[i] = order.pricePerAsset * order.assetAmount;
                ordersAssetAmounts[i] = order.assetAmount;
                totalExpectedPayout += expectedPayouts[i];
                sellersBalancesBefore[i] = sellers[i].balance;
                vm.expectEmit(true, true, true, true);
                emit IOrderbookDex.OrderFilled(
                    sellers[i],
                    orderIds[i],
                    buyer,
                    order.assetAmount,
                    order.pricePerAsset
                );
            }
            vm.startPrank(buyer);
            dex.fillOrdersExactEth{value: totalExpectedPayout + 1000}(
                totalAssetAmount,
                sellers,
                orderIds
            );

            assertEq(buyer.balance, buyerBalanceBefore - totalExpectedPayout);
            for (uint256 i = 0; i < ordersCount; i++) {
                IOrderbookDex.Order memory order = dex.getOrder(sellers[i], orderIds[i]);
                assertEq(sellers[i].balance, sellersBalancesBefore[i] + expectedPayouts[i]);
                assertEq(order.assetAmount, 0);
                assertEq(asset.balanceOf(address(dex), order.assetId), 0);
                assertEq(asset.balanceOf(buyer, order.assetId), ordersAssetAmounts[i]);
            }
        }
    }

    function testFuzz_FillOrdersExactAsset(uint256 price) public {
        uint256 ordersCount = 5;
        vm.assume(price / ordersCount > 0);
        vm.assume(price < type(uint256).max / ordersCount);
        uint256[] memory orderIds = new uint256[](ordersCount);
        address payable[] memory sellers = new address payable[](ordersCount);
        uint256 totalAssetAmount;
        address buyer = address(this);
        for (uint256 i = 0; i < ordersCount; i++) {
            address payable seller = payable(vm.addr(uint256(keccak256(abi.encodePacked(i)))));
            uint256 assetAmount = price / (ordersCount - i);
            uint256 orderId = dex.getSellerOrderId(seller);
            uint256 pricePerAsset = price / assetAmount;
            orderIds[i] = orderId;
            sellers[i] = seller;
            vm.startPrank(seller);
            uint256 assetId = asset.mint(assetAmount, "");
            asset.setApprovalForAll(address(dex), true);
            dex.createSellOrder(assetId, assetAmount, pricePerAsset);
            totalAssetAmount += assetAmount;
        }

        {
            vm.deal(buyer, type(uint256).max);
            uint256 buyerBalanceBefore = buyer.balance;
            uint256[] memory sellersBalancesBefore = new uint256[](ordersCount);
            uint256[] memory expectedPayouts = new uint256[](ordersCount);
            uint256[] memory ordersAssetAmounts = new uint256[](ordersCount);
            uint256 totalExpectedPayout;
            for (uint256 i = 0; i < ordersCount; i++) {
                IOrderbookDex.Order memory order = dex.getOrder(sellers[i], orderIds[i]);
                expectedPayouts[i] = order.pricePerAsset * order.assetAmount;
                ordersAssetAmounts[i] = order.assetAmount;
                totalExpectedPayout += expectedPayouts[i];
                sellersBalancesBefore[i] = sellers[i].balance;
                vm.expectEmit(true, true, true, true);
                emit IOrderbookDex.OrderFilled(
                    sellers[i],
                    orderIds[i],
                    buyer,
                    order.assetAmount,
                    order.pricePerAsset
                );
            }
            vm.startPrank(buyer);
            dex.fillOrdersExactAsset{value: totalExpectedPayout + 1000}(
                totalAssetAmount,
                sellers,
                orderIds
            );

            assertEq(buyer.balance, buyerBalanceBefore - totalExpectedPayout);
            for (uint256 i = 0; i < ordersCount; i++) {
                IOrderbookDex.Order memory order = dex.getOrder(sellers[i], orderIds[i]);
                assertEq(sellers[i].balance, sellersBalancesBefore[i] + expectedPayouts[i]);
                assertEq(order.assetAmount, 0);
                assertEq(asset.balanceOf(address(dex), order.assetId), 0);
                assertEq(asset.balanceOf(buyer, order.assetId), ordersAssetAmounts[i]);
            }
        }
    }

    function testFuzz_PartialFillExactEth(
        uint256 assetAmount,
        uint256 pricePerAsset,
        uint256 assetAmountToBuy
    ) public {
        vm.assume(assetAmount > 0 && pricePerAsset > 0);
        vm.assume(assetAmount < type(uint256).max / pricePerAsset);
        vm.assume(pricePerAsset < type(uint256).max / assetAmount);
        vm.assume(assetAmountToBuy < assetAmount);

        address buyer = alice;
        address payable seller = payable(address(this));
        vm.deal(buyer, assetAmount * pricePerAsset);
        uint256 orderId = dex.getSellerOrderId(address(this));
        vm.startPrank(seller);
        uint256 assetId = asset.mint(assetAmount, "");
        asset.setApprovalForAll(address(dex), true);
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);

        uint256 buyerBalanceBefore = buyer.balance;
        uint256 sellerBalanceBefore = address(this).balance;
        address payable[] memory sellers = new address payable[](1);
        sellers[0] = seller;
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        vm.startPrank(buyer);
        dex.fillOrdersExactEth{value: assetAmountToBuy * pricePerAsset}(
            assetAmountToBuy,
            sellers,
            orderIds
        );

        IOrderbookDex.Order memory order = dex.getOrder(address(this), orderId);
        assertEq(buyer.balance, buyerBalanceBefore - (assetAmountToBuy * pricePerAsset));
        assertEq(address(this).balance, sellerBalanceBefore + (assetAmountToBuy * pricePerAsset));
        assertEq(order.assetAmount, assetAmount - assetAmountToBuy);
        assertEq(asset.balanceOf(address(dex), assetId), assetAmount - assetAmountToBuy);
        assertEq(asset.balanceOf(buyer, assetId), assetAmountToBuy);
    }

    function testFuzz_PartialFillExactAsset(
        uint256 assetAmount,
        uint256 pricePerAsset,
        uint256 assetAmountToBuy
    ) public {
        vm.assume(assetAmount > 0 && pricePerAsset > 0);
        vm.assume(assetAmount < type(uint256).max / pricePerAsset);
        vm.assume(pricePerAsset < type(uint256).max / assetAmount);
        vm.assume(assetAmountToBuy < assetAmount);

        address buyer = alice;
        address payable seller = payable(address(this));
        vm.deal(buyer, assetAmount * pricePerAsset);
        uint256 orderId = dex.getSellerOrderId(address(this));
        vm.startPrank(seller);
        uint256 assetId = asset.mint(assetAmount, "");
        asset.setApprovalForAll(address(dex), true);
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);

        uint256 buyerBalanceBefore = buyer.balance;
        uint256 sellerBalanceBefore = address(this).balance;
        address payable[] memory sellers = new address payable[](1);
        sellers[0] = seller;
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        vm.startPrank(buyer);
        dex.fillOrdersExactAsset{value: buyerBalanceBefore}(assetAmountToBuy, sellers, orderIds);

        IOrderbookDex.Order memory order = dex.getOrder(address(this), orderId);
        assertEq(buyer.balance, buyerBalanceBefore - (assetAmountToBuy * pricePerAsset));
        assertEq(address(this).balance, sellerBalanceBefore + (assetAmountToBuy * pricePerAsset));
        assertEq(order.assetAmount, assetAmount - assetAmountToBuy);
        assertEq(asset.balanceOf(address(dex), assetId), assetAmount - assetAmountToBuy);
        assertEq(asset.balanceOf(buyer, assetId), assetAmountToBuy);
    }

    function testFuzz_ExcessValueIsRefundedFillExactEth(
        uint256 assetAmount,
        uint256 pricePerAsset
    ) public {
        uint256 multiplier = 3;
        vm.assume(assetAmount > 0 && pricePerAsset > 0);
        vm.assume(assetAmount < type(uint256).max / pricePerAsset / multiplier);
        vm.assume(pricePerAsset < type(uint256).max / assetAmount / multiplier);

        vm.deal(alice, assetAmount * pricePerAsset * multiplier);
        uint256 orderId = dex.getSellerOrderId(address(this));
        uint256 assetId = asset.mint(assetAmount, "");
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);

        uint256 aliceBalanceBefore = alice.balance;
        address payable[] memory sellers = new address payable[](1);
        sellers[0] = payable(address(this));
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        vm.startPrank(alice);
        dex.fillOrdersExactEth{value: alice.balance}(assetAmount, sellers, orderIds);
        assertEq(alice.balance, aliceBalanceBefore - (assetAmount * pricePerAsset));
    }

    function testFuzz_ExcessValueIsRefundedFillExactAsset(
        uint256 assetAmount,
        uint256 pricePerAsset
    ) public {
        uint256 multiplier = 3;
        vm.assume(assetAmount > 0 && pricePerAsset > 0);
        vm.assume(assetAmount < type(uint256).max / pricePerAsset / multiplier);
        vm.assume(pricePerAsset < type(uint256).max / assetAmount / multiplier);

        vm.deal(alice, assetAmount * pricePerAsset * multiplier);
        uint256 orderId = dex.getSellerOrderId(address(this));
        uint256 assetId = asset.mint(assetAmount, "");
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);

        uint256 aliceBalanceBefore = alice.balance;
        address payable[] memory sellers = new address payable[](1);
        sellers[0] = payable(address(this));
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        vm.startPrank(alice);
        dex.fillOrdersExactAsset{value: alice.balance}(assetAmount, sellers, orderIds);
        assertEq(alice.balance, aliceBalanceBefore - (assetAmount * pricePerAsset));
    }

    function test_WontFillOrderIfCancelled() public {
        uint256 assetAmount = 100;
        uint256 pricePerAsset = 200;
        uint256 orderId = dex.getSellerOrderId(address(this));
        uint256 assetId = asset.mint(assetAmount, "");
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);
        dex.cancelSellOrder(orderId);

        uint256 aliceBalanceBefore = alice.balance;
        address payable[] memory sellers = new address payable[](1);
        sellers[0] = payable(address(this));
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        vm.startPrank(alice);

        dex.fillOrdersExactEth{value: assetAmount * pricePerAsset}(0, sellers, orderIds);
        assertEq(alice.balance, aliceBalanceBefore);
        dex.fillOrdersExactAsset{value: assetAmount * pricePerAsset}(0, sellers, orderIds);
        assertEq(alice.balance, aliceBalanceBefore);
    }

    function test_CannotCreateOrderWithZeroAssetAmount() public {
        uint256 assetId = asset.mint(0, "");

        vm.expectRevert(abi.encodeWithSelector(OrderbookDex.InvalidInput.selector, 0));
        dex.createSellOrder(assetId, 0, 100);
    }

    function test_CannotCancelOrderIfDoesNotExist() public {
        uint256 orderId = dex.getSellerOrderId(address(this));
        vm.expectRevert(abi.encodeWithSelector(OrderbookDex.OrderDoesNotExist.selector, orderId));
        dex.cancelSellOrder(orderId);
    }

    function testFuzz_CannotFillOrderWithInvalidInputArity(
        address payable[] memory sellers,
        uint256[] memory orderIds
    ) public {
        vm.assume(sellers.length != orderIds.length);

        vm.expectRevert(OrderbookDex.InvalidInputArity.selector);
        dex.fillOrdersExactEth(0, sellers, orderIds);

        vm.expectRevert(OrderbookDex.InvalidInputArity.selector);
        dex.fillOrdersExactAsset(0, sellers, orderIds);
    }

    function test_CannotFillOrderIfInsufficientEndAmountExactEth() public {
        uint256 assetAmount = 10;
        uint256 pricePerAsset = 100;
        uint256 orderId = dex.getSellerOrderId(address(this));
        uint256 assetId = asset.mint(assetAmount, "");
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);

        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        address payable[] memory sellers = new address payable[](1);
        sellers[0] = payable(address(this));
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                OrderbookDex.InsufficientEndAmount.selector,
                assetAmount + 1,
                assetAmount
            )
        );
        dex.fillOrdersExactEth{value: assetAmount * pricePerAsset}(
            assetAmount + 1,
            sellers,
            orderIds
        );
    }

    function test_CannotFillOrderIfInsufficientEndAmountExactAsset() public {
        uint256 assetAmount = 10;
        uint256 pricePerAsset = 100;
        uint256 orderId = dex.getSellerOrderId(address(this));
        uint256 assetId = asset.mint(assetAmount, "");
        dex.createSellOrder(assetId, assetAmount, pricePerAsset);

        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        address payable[] memory sellers = new address payable[](1);
        sellers[0] = payable(address(this));
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                OrderbookDex.InsufficientEndAmount.selector,
                assetAmount + 1,
                assetAmount
            )
        );
        dex.fillOrdersExactAsset{value: assetAmount * pricePerAsset}(
            assetAmount + 1,
            sellers,
            orderIds
        );
    }

    function test_CannotSendEtherToDex() public {
        vm.expectRevert(Address.FailedInnerCall.selector);
        this.tryToSendEthToDex();
    }

    receive() external payable {}
}
