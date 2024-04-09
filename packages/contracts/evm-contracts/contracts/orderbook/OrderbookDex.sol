// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IInverseProjected1155} from "../token/IInverseProjected1155.sol";
import {IOrderbookDex} from "./IOrderbookDex.sol";

/// @notice Facilitates base-chain trading of an asset that is living on a different app-chain.
contract OrderbookDex is IOrderbookDex, ERC1155Holder, ReentrancyGuard {
    using Address for address payable;

    IInverseProjected1155 internal asset;
    mapping(uint256 orderId => Order) internal orders;
    uint256 internal currentOrderId;

    error OrderDoesNotExist(uint256 orderId);
    error InsufficientEndAmount(uint256 expectedAmount, uint256 actualAmount);
    error InvalidInput(uint256 input);
    error Unauthorized();

    constructor(IInverseProjected1155 _asset) {
        asset = _asset;
    }

    /// @notice Returns the address of the asset that is being traded in this DEX contract.
    function getAsset() public view virtual returns (address) {
        return address(asset);
    }

    /// @notice Returns the `orderId` of the next sell order.
    function getCurrentOrderId() public view virtual returns (uint256) {
        return currentOrderId;
    }

    /// @notice Returns the Order struct information about an order identified by the `orderId`.
    function getOrder(uint256 orderId) public view virtual returns (Order memory) {
        return orders[orderId];
    }

    /// @notice Creates a sell order for the `assetAmount` of `assetId` at `pricePerAsset`.
    /// @dev The order information is saved in a mapping `orderId -> Order`, with `orderId` being a unique incremental identifier.
    /// MUST transfer the `assetAmount` of `assetId` from the seller to the contract.
    /// MUST emit `OrderCreated` event.
    /// @return The unique identifier of the created order.
    function createSellOrder(
        uint256 assetId,
        uint256 assetAmount,
        uint256 pricePerAsset
    ) public virtual returns (uint256) {
        if (assetAmount == 0 || pricePerAsset == 0) {
            revert InvalidInput(0);
        }
        asset.safeTransferFrom(msg.sender, address(this), assetId, assetAmount, bytes(""));
        Order memory newOrder = Order({
            assetId: assetId,
            assetAmount: assetAmount,
            pricePerAsset: pricePerAsset,
            seller: payable(msg.sender)
        });
        uint256 orderId = currentOrderId;
        orders[orderId] = newOrder;
        emit OrderCreated(msg.sender, orderId, assetId, assetAmount, pricePerAsset);
        currentOrderId++;
        return orderId;
    }

    /// @notice Consecutively fills an array of orders identified by the `orderId` of each order,
    /// by providing an exact amount of ETH and requesting a specific minimum amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be at least `minimumAsset`.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the excess back to `msg.sender`.
    /// MUST decrease the `assetAmount` parameter for the specified order according to how much of it was filled,
    /// and transfer that amount of the order's `assetId` to the buyer.
    /// MUST emit `OrderFilled` event for each order accordingly.
    function fillOrdersExactEth(
        uint256 minimumAsset,
        uint256[] memory orderIds
    ) public payable virtual nonReentrant {
        uint256 length = orderIds.length;
        uint256 remainingEth = msg.value;
        uint256 totalAssetReceived;
        for (uint256 i = 0; i < length; i++) {
            uint256 orderId = orderIds[i];
            Order storage order = orders[orderId];
            if (order.assetAmount == 0) {
                continue;
            }
            uint256 assetsToBuy = remainingEth / order.pricePerAsset;
            if (assetsToBuy == 0) {
                continue;
            }
            if (assetsToBuy > order.assetAmount) {
                assetsToBuy = order.assetAmount;
            }
            order.assetAmount -= assetsToBuy;
            remainingEth -= assetsToBuy * order.pricePerAsset;
            totalAssetReceived += assetsToBuy;
            asset.safeTransferFrom(
                address(this),
                msg.sender,
                order.assetId,
                assetsToBuy,
                bytes("")
            );
            order.seller.sendValue(assetsToBuy * order.pricePerAsset);
            emit OrderFilled(order.seller, orderId, msg.sender, assetsToBuy, order.pricePerAsset);
            if (remainingEth == 0) {
                break;
            }
        }
        if (totalAssetReceived < minimumAsset) {
            revert InsufficientEndAmount(minimumAsset, totalAssetReceived);
        }
        if (remainingEth > 0) {
            payable(msg.sender).sendValue(remainingEth);
        }
    }

    /// @notice Consecutively fills an array of orders identified by the `orderId` of each order,
    /// by providing a possibly surplus amount of ETH and requesting an exact amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be exactly `assetAmount`. Excess ETH MUST be returned back to `msg.sender`.
    /// MUST decrease the `assetAmount` parameter for the specified order according to how much of it was filled,
    /// and transfer that amount of the order's `assetId` to the buyer.
    /// MUST emit `OrderFilled` event for each order accordingly.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the difference back to `msg.sender`.
    function fillOrdersExactAsset(
        uint256 assetAmount,
        uint256[] memory orderIds
    ) public payable virtual nonReentrant {
        uint256 length = orderIds.length;
        uint256 remainingAsset = assetAmount;
        uint256 remainingEth = msg.value;
        for (uint256 i = 0; i < length; i++) {
            uint256 orderId = orderIds[i];
            Order storage order = orders[orderId];
            if (order.assetAmount == 0) {
                continue;
            }
            uint256 assetsToBuy = order.assetAmount;
            if (assetsToBuy > remainingAsset) {
                assetsToBuy = remainingAsset;
            }
            if (assetsToBuy == 0) {
                continue;
            }
            order.assetAmount -= assetsToBuy;
            remainingEth -= assetsToBuy * order.pricePerAsset;
            remainingAsset -= assetsToBuy;
            asset.safeTransferFrom(
                address(this),
                msg.sender,
                order.assetId,
                assetsToBuy,
                bytes("")
            );
            order.seller.sendValue(assetsToBuy * order.pricePerAsset);
            emit OrderFilled(order.seller, orderId, msg.sender, assetsToBuy, order.pricePerAsset);
            if (remainingAsset == 0) {
                break;
            }
        }
        if (remainingAsset > 0) {
            revert InsufficientEndAmount(assetAmount, assetAmount - remainingAsset);
        }
        if (remainingEth > 0) {
            payable(msg.sender).sendValue(remainingEth);
        }
    }

    /// @notice Cancels the sell order identified by the `orderId`, transferring the order's assets back to the seller.
    /// @dev MUST revert if the order's seller is not `msg.sender`.
    /// MUST change the `assetAmount` parameter for the specified order to `0`.
    /// MUST emit `OrderCancelled` event.
    /// MUST transfer the `assetAmount` of `assetId` back to the seller.
    function cancelSellOrder(uint256 orderId) public virtual {
        Order storage order = orders[orderId];
        if (msg.sender != order.seller) {
            revert Unauthorized();
        }
        uint256 assetAmount = order.assetAmount;
        order.assetAmount = 0;
        asset.safeTransferFrom(address(this), msg.sender, order.assetId, assetAmount, bytes(""));
        emit OrderCancelled(msg.sender, orderId);
    }

    /// @dev Returns true if this contract implements the interface defined by `interfaceId`. See EIP165.
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Holder, IERC165) returns (bool) {
        return
            interfaceId == type(IOrderbookDex).interfaceId || super.supportsInterface(interfaceId);
    }

    function _getOrderId(address seller, uint96 orderId) internal view virtual returns (uint256) {
        return (uint256(uint160(seller)) << 96) ^ orderId;
    }
}
