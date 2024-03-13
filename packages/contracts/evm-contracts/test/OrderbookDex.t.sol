// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {CheatCodes} from "../test-lib/cheatcodes.sol";
import {CTest} from "../test-lib/ctest.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IOrderbookDex} from "../contracts/orderbook/IOrderbookDex.sol";
import {OrderbookDex} from "../contracts/orderbook/OrderbookDex.sol";

contract OrderbookDexTest is CTest {
    using Address for address payable;

    CheatCodes vm = CheatCodes(HEVM_ADDRESS);
    OrderbookDex public dex;
    address alice = vm.addr(uint256(keccak256(abi.encodePacked("alice"))));
    address boris = vm.addr(uint256(keccak256(abi.encodePacked("boris"))));

    function tryToSendEthToDex() public {
        payable(address(dex)).sendValue(1);
    }

    function setUp() public {
        dex = new OrderbookDex();
        vm.deal(alice, 100 ether);
        vm.deal(boris, 100 ether);
    }

    function test_SupportsInterface() public {
        assertTrue(dex.supportsInterface(type(IERC165).interfaceId));
        assertTrue(dex.supportsInterface(type(IOrderbookDex).interfaceId));
    }

    function testFuzz_Fills(uint256 price) public {
        uint256 ordersCount = 5;
        vm.assume(price < type(uint256).max / ordersCount);
        uint256 firstOrderId = dex.getOrdersIndex();
        for (uint256 i = 0; i < ordersCount; i++) {
            uint256 orderId = dex.getOrdersIndex();
            address seller = vm.addr(uint256(keccak256(abi.encodePacked(i))));
            uint256 assetAmount = uint256(keccak256(abi.encodePacked(price)));
            vm.prank(seller);

            vm.expectEmit(true, true, true, true);
            emit OrderbookDex.OrderCreated(orderId, seller, assetAmount, price);
            dex.createSellOrder(assetAmount, price);

            uint256 newOrderId = dex.getOrdersIndex();
            OrderbookDex.Order memory order = dex.getOrder(orderId);
            assertEq(newOrderId, orderId + 1);
            assertTrue(order.active);
            assertEq(order.assetAmount, assetAmount);
            assertEq(order.price, price);
            assertEq(order.seller, seller);
        }

        {
            uint256 currentOrderId = dex.getOrdersIndex();
            uint256[] memory orderIds = new uint256[](ordersCount);
            for (uint256 i = 0; i < ordersCount; i++) {
                orderIds[i] = firstOrderId + i;
            }

            address buyer = vm.addr(
                uint256(keccak256(abi.encodePacked(uint256(type(uint256).max))))
            );
            vm.deal(buyer, type(uint256).max);
            uint256[] memory sellersBalancesBefore = new uint256[](ordersCount);
            for (uint256 i = 0; i < ordersCount; i++) {
                OrderbookDex.Order memory order = dex.getOrder(firstOrderId + i);
                sellersBalancesBefore[i] = order.seller.balance;
                vm.expectEmit(true, true, true, true);
                emit OrderbookDex.OrderFilled(
                    firstOrderId + i,
                    order.seller,
                    buyer,
                    order.assetAmount,
                    order.price
                );
            }
            vm.prank(buyer);
            dex.fillSellOrders{value: price * ordersCount}(orderIds);

            assertEq(dex.getOrdersIndex(), currentOrderId);
            for (uint256 i = 0; i < ordersCount; i++) {
                OrderbookDex.Order memory order = dex.getOrder(firstOrderId + i);
                assertTrue(!order.active);
                assertEq(order.seller.balance, sellersBalancesBefore[i] + order.price);
            }
        }
    }

    function test_ExcessValueIsRefunded() public {
        uint256 price = 100;
        uint256 orderId = dex.getOrdersIndex();
        dex.createSellOrder(10, price);

        vm.prank(alice);
        uint256 aliceBalanceBefore = alice.balance;
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        dex.fillSellOrders{value: price * 5}(orderIds);
        assertEq(alice.balance, aliceBalanceBefore - price);
    }

    function test_CannotCancelOrderIfUnauthorized() public {
        uint256 orderId = dex.getOrdersIndex();
        dex.createSellOrder(100, 200);

        vm.prank(alice);
        vm.expectRevert(OrderbookDex.Unauthorized.selector);
        dex.cancelSellOrder(orderId);
    }

    function test_CannotFillOrderIfCancelled() public {
        uint256 orderId = dex.getOrdersIndex();
        dex.createSellOrder(100, 200);
        dex.cancelSellOrder(orderId);

        vm.prank(alice);
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        vm.expectRevert(abi.encodeWithSelector(OrderbookDex.OrderIsInactive.selector, orderId));
        dex.fillSellOrders(orderIds);
    }

    function test_CannotFillOrderIfAlreadyFilled() public {
        uint256 orderId = dex.getOrdersIndex();
        uint256 price = 1000;
        dex.createSellOrder(100, price);

        vm.prank(alice);
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        dex.fillSellOrders{value: price}(orderIds);

        vm.prank(boris);
        vm.expectRevert(abi.encodeWithSelector(OrderbookDex.OrderIsInactive.selector, orderId));
        dex.fillSellOrders{value: price}(orderIds);
    }

    function test_CannotFillOrderIfInsufficientValue() public {
        uint256 price = 100;
        uint256 orderId = dex.getOrdersIndex();
        dex.createSellOrder(10, price);

        vm.prank(alice);
        uint256[] memory orderIds = new uint256[](1);
        orderIds[0] = orderId;
        vm.expectRevert(
            abi.encodeWithSelector(Address.AddressInsufficientBalance.selector, address(dex))
        );
        dex.fillSellOrders{value: price - 1}(orderIds);
    }

    function test_CannotSendEtherToDex() public {
        vm.expectRevert(Address.FailedInnerCall.selector);
        this.tryToSendEthToDex();
    }

    receive() external payable {}
}
