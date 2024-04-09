// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @notice Facilitates base-chain trading of an asset that is living on a different app-chain.
interface IOrderbookDex is IERC165 {
    struct Order {
        uint256 assetAmount;
        uint256 price;
        address payable seller;
        bool active;
    }

    /// @notice Returns the current index of orders (index that a new sell order will be mapped to).
    function getOrdersIndex() external view returns (uint256);

    /// @notice Returns the Order struct information about order of specified `orderId`.
    function getOrder(uint256 orderId) external view returns (Order memory);

    /// @notice Creates a sell order for the specified `assetAmount` at specified `price`.
    /// @dev The order is saved in a mapping from incremental ID to Order struct.
    function createSellOrder(uint256 assetAmount, uint256 price) external;

    /// @notice Fills an array of orders specified by `orderIds`.
    /// @dev Reverts if msg.value is less than the sum of orders' prices.
    /// If msg.value is more than the sum of orders' prices, it should refund the difference back to msg.sender.
    function fillSellOrders(uint256[] memory orderIds) external payable;

    /// @notice Cancels the sell order specified by `orderId`, making it unfillable.
    /// @dev Reverts if the msg.sender is not the order's seller.
    function cancelSellOrder(uint256 orderId) external;
}
