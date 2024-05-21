// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IInverseProjected1155} from "../token/IInverseProjected1155.sol";
import {IOrderbookDex} from "./IOrderbookDex.sol";

/// @notice Facilitates base-chain trading of an asset that is living on a different app-chain.
contract OrderbookDex is IOrderbookDex, ERC1155Holder, ReentrancyGuard {
    using Address for address payable;
    using Arrays for uint256[];

    /// @inheritdoc IOrderbookDex
    address public immutable override asset;
    /// @inheritdoc IOrderbookDex
    uint256 public override currentOrderId;
    mapping(uint256 orderId => Order) internal orders;

    error OrderDoesNotExist(uint256 orderId);
    error InsufficientEndAmount(uint256 expectedAmount, uint256 actualAmount);
    error InvalidArrayLength();
    error InvalidInput(uint256 input);
    error Unauthorized(address sender);

    constructor(address _asset) {
        asset = _asset;
    }

    /// @inheritdoc IOrderbookDex
    function getOrder(uint256 orderId) public view virtual returns (Order memory) {
        return orders[orderId];
    }

    /// @inheritdoc IOrderbookDex
    function createSellOrder(
        uint256 assetId,
        uint256 assetAmount,
        uint256 pricePerAsset
    ) public virtual returns (uint256) {
        if (assetAmount == 0 || pricePerAsset == 0) {
            revert InvalidInput(0);
        }
        IInverseProjected1155(asset).safeTransferFrom(
            msg.sender,
            address(this),
            assetId,
            assetAmount,
            bytes("")
        );
        Order memory newOrder = Order({
            assetId: assetId,
            assetAmount: assetAmount,
            pricePerAsset: pricePerAsset,
            seller: payable(msg.sender)
        });
        uint256 orderId = currentOrderId;
        orders[orderId] = newOrder;
        emit OrderCreated(msg.sender, orderId, assetId, assetAmount, pricePerAsset);
        ++currentOrderId;
        return orderId;
    }

    /// @inheritdoc IOrderbookDex
    function createBatchSellOrder(
        uint256[] memory assetIds,
        uint256[] memory assetAmounts,
        uint256[] memory pricesPerAssets
    ) public virtual returns (uint256[] memory) {
        if (assetIds.length != assetAmounts.length || assetIds.length != pricesPerAssets.length) {
            revert InvalidArrayLength();
        }
        uint256[] memory orderIds = new uint256[](assetIds.length);
        for (uint256 i; i < assetIds.length; ) {
            orderIds[i] = createSellOrder(
                assetIds.unsafeMemoryAccess(i),
                assetAmounts.unsafeMemoryAccess(i),
                pricesPerAssets.unsafeMemoryAccess(i)
            );
            unchecked {
                ++i;
            }
        }
        return orderIds;
    }

    /// @inheritdoc IOrderbookDex
    function fillOrdersExactEth(
        uint256 minimumAsset,
        uint256[] memory orderIds
    ) public payable virtual nonReentrant {
        uint256 length = orderIds.length;
        uint256 remainingEth = msg.value;
        uint256 totalAssetReceived;
        for (uint256 i; i < length; ++i) {
            uint256 orderId = orderIds.unsafeMemoryAccess(i);
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
            IInverseProjected1155(asset).safeTransferFrom(
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

    /// @inheritdoc IOrderbookDex
    function fillOrdersExactAsset(
        uint256 assetAmount,
        uint256[] memory orderIds
    ) public payable virtual nonReentrant {
        uint256 length = orderIds.length;
        uint256 remainingAsset = assetAmount;
        uint256 remainingEth = msg.value;
        for (uint256 i; i < length; ++i) {
            uint256 orderId = orderIds.unsafeMemoryAccess(i);
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
            IInverseProjected1155(asset).safeTransferFrom(
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

    /// @inheritdoc IOrderbookDex
    function cancelSellOrder(uint256 orderId) public virtual {
        Order storage order = orders[orderId];
        if (msg.sender != order.seller) {
            revert Unauthorized(msg.sender);
        }
        uint256 assetAmount = order.assetAmount;
        delete order.assetAmount;
        IInverseProjected1155(asset).safeTransferFrom(
            address(this),
            msg.sender,
            order.assetId,
            assetAmount,
            bytes("")
        );
        emit OrderCancelled(msg.sender, orderId);
    }

    /// @inheritdoc IOrderbookDex
    function cancelBatchSellOrder(uint256[] memory orderIds) public virtual {
        for (uint256 i; i < orderIds.length; ) {
            cancelSellOrder(orderIds.unsafeMemoryAccess(i));
            unchecked {
                ++i;
            }
        }
    }

    /// @dev Returns true if this contract implements the interface defined by `interfaceId`. See EIP165.
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Holder, IERC165) returns (bool) {
        return
            interfaceId == type(IOrderbookDex).interfaceId || super.supportsInterface(interfaceId);
    }
}
