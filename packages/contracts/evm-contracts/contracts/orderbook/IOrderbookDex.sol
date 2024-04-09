// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

/// @notice Facilitates base-chain trading of an asset that is living on a different app-chain.
/// @dev Orders are identified by a unique incremental `orderId`.
interface IOrderbookDex is IERC1155Receiver {
    struct Order {
        /// @dev The asset's unique token identifier.
        uint256 assetId;
        /// @dev The amount of the asset that is available to be sold.
        uint256 assetAmount;
        /// @dev The price per one unit of asset.
        uint256 pricePerAsset;
        /// @dev The seller's address.
        address payable seller;
    }

    /// @param seller The seller's address.
    /// @param orderId The order's unique identifier.
    /// @param assetId The asset's unique token identifier.
    /// @param assetAmount The amount of the asset that has been put for sale.
    /// @param pricePerAsset The requested price per one unit of asset.
    event OrderCreated(
        address indexed seller,
        uint256 indexed orderId,
        uint256 indexed assetId,
        uint256 assetAmount,
        uint256 pricePerAsset
    );

    /// @param seller The seller's address.
    /// @param orderId The order's unique identifier.
    /// @param buyer The buyer's address.
    /// @param assetAmount The amount of the asset that was traded.
    /// @param pricePerAsset The price per one unit of asset that was paid.
    event OrderFilled(
        address indexed seller,
        uint256 indexed orderId,
        address indexed buyer,
        uint256 assetAmount,
        uint256 pricePerAsset
    );

    /// @param seller The seller's address.
    /// @param id The order's unique identifier.
    event OrderCancelled(address indexed seller, uint256 indexed id);

    /// @notice Returns the address of the asset that is being traded in this DEX contract.
    function getAsset() external view returns (address);

    /// @notice Returns the `orderId` of the next sell order.
    function getCurrentOrderId() external view returns (uint256);

    /// @notice Returns the Order struct information about an order identified by the `orderId`.
    function getOrder(uint256 orderId) external view returns (Order memory);

    /// @notice Creates a sell order for the `assetAmount` of `assetId` at `pricePerAsset`.
    /// @dev The order information is saved in a mapping `orderId -> Order`, with `orderId` being a unique incremental identifier.
    /// MUST transfer the `assetAmount` of `assetId` from the seller to the contract.
    /// MUST emit `OrderCreated` event.
    /// @return The unique identifier of the created order.
    function createSellOrder(
        uint256 assetId,
        uint256 assetAmount,
        uint256 pricePerAsset
    ) external returns (uint256);

    /// @notice Creates a batch of sell orders for the `assetAmount` of `assetId` at `pricePerAsset`.
    /// @dev This is a batched version of `createSellOrder` that simply iterates through the arrays to call said function.
    /// @return The unique identifiers of the created orders.
    function createBatchSellOrder(
        uint256[] memory assetIds,
        uint256[] memory assetAmounts,
        uint256[] memory pricesPerAssets
    ) external returns (uint256[] memory);

    /// @notice Consecutively fills an array of orders identified by the `orderId` of each order,
    /// by providing an exact amount of ETH and requesting a specific minimum amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be at least `minimumAsset`.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the excess back to `msg.sender`.
    /// MUST decrease the `assetAmount` parameter for the specified order according to how much of it was filled,
    /// and transfer that amount of the order's `assetId` to the buyer.
    /// MUST emit `OrderFilled` event for each order accordingly.
    function fillOrdersExactEth(uint256 minimumAsset, uint256[] memory orderIds) external payable;

    /// @notice Consecutively fills an array of orders identified by the `orderId` of each order,
    /// by providing a possibly surplus amount of ETH and requesting an exact amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be exactly `assetAmount`. Excess ETH MUST be returned back to `msg.sender`.
    /// MUST decrease the `assetAmount` parameter for the specified order according to how much of it was filled,
    /// and transfer that amount of the order's `assetId` to the buyer.
    /// MUST emit `OrderFilled` event for each order accordingly.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the difference back to `msg.sender`.
    function fillOrdersExactAsset(uint256 assetAmount, uint256[] memory orderIds) external payable;

    /// @notice Cancels the sell order identified by the `orderId`, transferring the order's assets back to the seller.
    /// @dev MUST revert if the order's seller is not `msg.sender`.
    /// MUST change the `assetAmount` parameter for the specified order to `0`.
    /// MUST emit `OrderCancelled` event.
    /// MUST transfer the `assetAmount` of `assetId` back to the seller.
    function cancelSellOrder(uint256 orderId) external;

    /// @notice Cancels a batch of sell orders identified by the `orderIds`, transferring the orders' assets back to the seller.
    /// @dev This is a batched version of `cancelSellOrder` that simply iterates through the array to call said function.
    function cancelBatchSellOrder(uint256[] memory orderIds) external;
}
