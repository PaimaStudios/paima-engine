// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IInverseProjected1155} from "../token/IInverseProjected1155.sol";
import {IOrderbookDex} from "./IOrderbookDex.sol";

/// @notice Facilitates trading an asset that is living on a different app-chain.
contract OrderbookDex is IOrderbookDex, ERC165, ReentrancyGuard {
    using Address for address payable;

    IInverseProjected1155 asset;
    mapping(address => mapping(uint256 => Order)) orders;
    mapping(address => uint256) sellersOrderId;

    error OrderDoesNotExist(uint256 orderId);
    error InsufficientEndAmount(uint256 expectedAmount, uint256 actualAmount);
    error InvalidInput(uint256 input);
    error InvalidInputArity();

    /// @notice Returns the address of the asset that is being traded.
    function getAsset() public view virtual returns (address) {
        return address(asset);
    }

    /// @notice Returns the seller's current `orderId` (index that their new sell order will be mapped to).
    function getSellerOrderId(address seller) public view virtual returns (uint256) {
        return sellersOrderId[seller];
    }

    /// @notice Returns the Order struct information about an order identified by the combination `<seller, orderId>`.
    function getOrder(address seller, uint256 orderId) public view virtual returns (Order memory) {
        return orders[seller][orderId];
    }

    /// @notice Creates a sell order with incremental seller-specific `orderId` for the specified `assetAmount` at specified `pricePerAsset`.
    /// @dev The order information is saved in a nested mapping `seller address -> orderId -> Order`.
    /// MUST emit `OrderCreated` event.
    function createSellOrder(uint256 assetAmount, uint256 pricePerAsset) public virtual {
        if (assetAmount == 0 || pricePerAsset == 0) {
            revert InvalidInput(0);
        }
        Order memory newOrder = Order({
            assetAmount: assetAmount,
            pricePerAsset: pricePerAsset,
            cancelled: false
        });
        uint256 orderId = sellersOrderId[msg.sender];
        orders[msg.sender][orderId] = newOrder;
        emit OrderCreated(msg.sender, orderId, assetAmount, pricePerAsset);
        sellersOrderId[msg.sender]++;
    }

    /// @notice Consecutively fills an array of orders identified by the combination `<seller, orderId>`,
    /// by providing an exact amount of ETH and requesting a specific minimum amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be at least `minimumAsset`.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the excess back to msg.sender.
    /// An order whose `cancelled` parameter has value `true` MUST NOT be filled.
    /// MUST change the `assetAmount` parameter for the specified order according to how much of it was filled.
    /// MUST emit `OrderFilled` event for each order accordingly.
    function fillOrdersExactEth(
        uint256 minimumAsset,
        address payable[] memory sellers,
        uint256[] memory orderIds
    ) public payable virtual nonReentrant {
        if (sellers.length != orderIds.length) {
            revert InvalidInputArity();
        }
        uint256 length = sellers.length;
        uint256 remainingEth = msg.value;
        uint256 totalAssetReceived;
        for (uint256 i = 0; i < length; i++) {
            address payable seller = sellers[i];
            uint256 orderId = orderIds[i];
            Order storage order = orders[seller][orderId];
            if (order.cancelled || order.assetAmount == 0 || order.pricePerAsset == 0) {
                continue;
            }
            uint256 assetsToBuy = remainingEth / order.pricePerAsset;
            if (assetsToBuy == 0) {
                continue;
            }
            if (assetsToBuy > order.assetAmount) {
                assetsToBuy = order.assetAmount;
            }
            seller.sendValue(assetsToBuy * order.pricePerAsset);
            order.assetAmount -= assetsToBuy;
            remainingEth -= assetsToBuy * order.pricePerAsset;
            totalAssetReceived += assetsToBuy;
            emit OrderFilled(seller, orderId, msg.sender, assetsToBuy, order.pricePerAsset);
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

    /// @notice Consecutively fills an array of orders identified by the combination `<seller, orderId>`,
    /// by providing a possibly surplus amount of ETH and requesting an exact amount of asset to receive.
    /// @dev Transfers portions of msg.value to the orders' sellers according to the price.
    /// The sum of asset amounts of filled orders MUST be exactly `assetAmount`. Excess ETH MUST be returned back to `msg.sender`.
    /// An order whose `cancelled` parameter has value `true` MUST NOT be filled.
    /// MUST change the `assetAmount` parameter for the specified order according to how much of it was filled.
    /// MUST emit `OrderFilled` event for each order accordingly.
    /// If msg.value is more than the sum of orders' prices, it MUST refund the difference back to msg.sender.
    function fillOrdersExactAsset(
        uint256 assetAmount,
        address payable[] memory sellers,
        uint256[] memory orderIds
    ) public payable virtual nonReentrant {
        if (sellers.length != orderIds.length) {
            revert InvalidInputArity();
        }
        uint256 length = sellers.length;
        uint256 remainingAsset = assetAmount;
        uint256 remainingEth = msg.value;
        for (uint256 i = 0; i < length; i++) {
            address payable seller = sellers[i];
            uint256 orderId = orderIds[i];
            Order storage order = orders[seller][orderId];
            if (order.cancelled || order.assetAmount == 0 || order.pricePerAsset == 0) {
                continue;
            }
            uint256 assetsToBuy = order.assetAmount;
            if (assetsToBuy > remainingAsset) {
                assetsToBuy = remainingAsset;
            }
            if (assetsToBuy == 0) {
                continue;
            }
            seller.sendValue(assetsToBuy * order.pricePerAsset);
            order.assetAmount -= assetsToBuy;
            remainingEth -= assetsToBuy * order.pricePerAsset;
            remainingAsset -= assetsToBuy;
            emit OrderFilled(seller, orderId, msg.sender, assetsToBuy, order.pricePerAsset);
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

    /// @notice Cancels the sell order identified by combination `<msg.sender, orderId>`, making it unfillable.
    /// @dev MUST change the `cancelled` parameter for the specified order to `true`.
    /// MUST emit `OrderCancelled` event.
    function cancelSellOrder(uint256 orderId) public virtual {
        if (orders[msg.sender][orderId].assetAmount == 0) {
            revert OrderDoesNotExist(orderId);
        }
        orders[msg.sender][orderId].cancelled = true;
        emit OrderCancelled(msg.sender, orderId);
    }

    /// @dev Returns true if this contract implements the interface defined by `interfaceId`. See EIP165.
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IOrderbookDex).interfaceId || super.supportsInterface(interfaceId);
    }
}
