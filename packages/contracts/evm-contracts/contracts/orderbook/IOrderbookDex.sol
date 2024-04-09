// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/// @notice Facilitates base-chain trading of an asset that is living on a different app-chain.
/// @dev The contract should never hold any ETH itself.
interface IOrderbookDex is IERC1155Receiver {
    struct Order {
        uint256 assetId;
        uint256 assetAmount;
        uint256 pricePerAsset;
    }

    event OrderCreated(
        address indexed seller,
        uint256 indexed orderId,
        uint256 assetAmount,
        uint256 pricePerAsset
    );
    event OrderFilled(
        address indexed seller,
        uint256 indexed orderId,
        address indexed buyer,
        uint256 assetAmount,
        uint256 pricePerAsset
    );
    event OrderCancelled(address indexed seller, uint256 indexed orderId);

    /// @notice Returns the address of the asset that is being traded.
    function getAsset() external view returns (address);

    /// @notice Returns the seller's current `orderId` (index that their new sell order will be mapped to).
    function getSellerOrderId(address seller) external view returns (uint256);

    /// @notice Returns the Order struct information about an order identified by the combination `<seller, orderId>`.
    function getOrder(address seller, uint256 orderId) external view returns (Order memory);

    /// @notice Creates a sell order with incremental seller-specific `orderId` for the specified `assetAmount` at specified `pricePerAsset`.
    /// @dev The order information is saved in a nested mapping `seller address -> orderId -> Order`.
    /// MUST emit `OrderCreated` event.
    function createSellOrder(uint256 assetId, uint256 assetAmount, uint256 pricePerAsset) external;

    /// @notice Consecutively fills an array of orders identified by the combination `<seller, orderId>`,
    /// by providing an exact amount of ETH and requesting a specific minimum amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be at least `minimumAsset`.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the excess back to msg.sender.
    /// MUST change the `assetAmount` parameter for the specified order according to how much of it was filled.
    /// MUST emit `OrderFilled` event for each order accordingly.
    function fillOrdersExactEth(
        uint256 minimumAsset,
        address payable[] memory sellers,
        uint256[] memory orderIds
    ) external payable;

    /// @notice Consecutively fills an array of orders identified by the combination `<seller, orderId>`,
    /// by providing a possibly surplus amount of ETH and requesting an exact amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be exactly `assetAmount`. Excess ETH MUST be returned back to `msg.sender`.
    /// MUST change the `assetAmount` parameter for the specified order according to how much of it was filled.
    /// MUST emit `OrderFilled` event for each order accordingly.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the difference back to msg.sender.
    function fillOrdersExactAsset(
        uint256 assetAmount,
        address payable[] memory sellers,
        uint256[] memory orderIds
    ) external payable;

    /// @notice Cancels the sell order identified by combination `<msg.sender, orderId>`, making it unfillable.
    /// @dev MUST change the `assetAmount` parameter for the specified order to `0`.
    /// MUST emit `OrderCancelled` event.
    function cancelSellOrder(uint256 orderId) external;
}
