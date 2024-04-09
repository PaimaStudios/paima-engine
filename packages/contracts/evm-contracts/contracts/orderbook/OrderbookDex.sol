// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IOrderbookDex} from "./IOrderbookDex.sol";

/// @notice Facilitates trading an asset that is living on a different app-chain.
contract OrderbookDex is IOrderbookDex, ERC165, ReentrancyGuard {
    using Address for address payable;

    mapping(uint256 => Order) public orders;
    uint256 public ordersIndex;

    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        uint256 assetAmount,
        uint256 price
    );
    event OrderFilled(
        uint256 indexed orderId,
        address indexed seller,
        address indexed buyer,
        uint256 assetAmount,
        uint256 price
    );
    event OrderCancelled(uint256 indexed orderId);

    error OrderIsInactive(uint256 orderId);
    error Unauthorized();

    /// @notice Returns the current index of orders (index that a new sell order will be mapped to).
    function getOrdersIndex() public view returns (uint256) {
        return ordersIndex;
    }

    /// @notice Returns the Order struct information about order of specified `orderId`.
    function getOrder(uint256 orderId) public view returns (Order memory) {
        return orders[orderId];
    }

    /// @notice Creates a sell order for the specified `assetAmount` at specified `price`.
    /// @dev The order is saved in a mapping from incremental ID to Order struct.
    function createSellOrder(uint256 assetAmount, uint256 price) public {
        Order memory newOrder = Order({
            seller: payable(msg.sender),
            assetAmount: assetAmount,
            price: price,
            active: true
        });
        orders[ordersIndex] = newOrder;
        emit OrderCreated(ordersIndex, msg.sender, assetAmount, price);
        ordersIndex++;
    }

    /// @notice Fills an array of orders specified by `orderIds`.
    /// @dev Reverts if msg.value is less than the sum of orders' prices.
    /// If msg.value is more than the sum of orders' prices, it should refund the difference back to msg.sender.
    function fillSellOrders(uint256[] memory orderIds) public payable nonReentrant {
        uint256 length = orderIds.length;
        uint256 totalPaid;
        for (uint256 i = 0; i < length; ) {
            uint256 orderId = orderIds[i];
            Order memory order = orders[orderId];
            if (!order.active) {
                revert OrderIsInactive(orderId);
            }
            order.seller.sendValue(order.price);
            totalPaid += order.price;
            orders[orderId].active = false;
            emit OrderFilled(orderId, order.seller, msg.sender, order.assetAmount, order.price);
            unchecked {
                i++;
            }
        }
        if (msg.value > totalPaid) {
            payable(msg.sender).sendValue(msg.value - totalPaid);
        }
    }

    /// @notice Cancels the sell order specified by `orderId`, making it unfillable.
    /// @dev Reverts if the msg.sender is not the order's seller.
    function cancelSellOrder(uint256 orderId) public {
        if (msg.sender != orders[orderId].seller) {
            revert Unauthorized();
        }
        orders[orderId].active = false;
        emit OrderCancelled(orderId);
    }

    /// @dev Returns true if this contract implements the interface defined by `interfaceId`. See EIP165.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IOrderbookDex).interfaceId || super.supportsInterface(interfaceId);
    }
}
