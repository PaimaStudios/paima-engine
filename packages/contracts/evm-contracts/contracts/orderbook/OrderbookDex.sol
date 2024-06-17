// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IInverseProjected1155} from "../token/IInverseProjected1155.sol";
import {IOrderbookDex} from "./IOrderbookDex.sol";

/// @notice Facilitates base-chain trading of assets that are living on a different app-chain.
/// @dev Orders are identified by an asset-specific unique incremental `orderId`.
contract OrderbookDex is IOrderbookDex, ERC1155Holder, Ownable, ReentrancyGuard {
    using Address for address payable;
    using Arrays for uint256[];
    using Arrays for address[];

    uint256 constant basisPoints = 10000;
    /// @notice Maximum fee is 10% (1000 bps).
    uint256 public constant maxFee = basisPoints / 10;
    /// @inheritdoc IOrderbookDex
    mapping(address asset => uint256 orderId) public currentOrderId;
    mapping(address asset => mapping(uint256 orderId => Order)) internal orders;
    mapping(address asset => FeeInfo) internal assetFeeInfo;
    /// @inheritdoc IOrderbookDex
    uint256 public defaultMakerFee;
    /// @inheritdoc IOrderbookDex
    uint256 public defaultTakerFee;
    /// @inheritdoc IOrderbookDex
    uint256 public orderCreationFee;

    error FeeTooHigh();
    error OrderDoesNotExist(uint256 orderId);
    error InsufficientEndAmount(uint256 expectedAmount, uint256 actualAmount);
    error InsufficientPayment();
    error InvalidArrayLength();
    error InvalidInput(uint256 input);
    error Unauthorized(address sender);

    constructor(
        address _owner,
        uint256 _defaultMakerFee,
        uint256 _defaultTakerFee,
        uint256 _orderCreationFee
    ) Ownable(_owner) {
        defaultMakerFee = _defaultMakerFee;
        defaultTakerFee = _defaultTakerFee;
        orderCreationFee = _orderCreationFee;
    }

    /// @inheritdoc IOrderbookDex
    function getAssetFeeInfo(address asset) public view virtual returns (FeeInfo memory) {
        return assetFeeInfo[asset];
    }

    /// @inheritdoc IOrderbookDex
    function getAssetAppliedFees(
        address asset
    ) public view virtual returns (uint256 makerFee, uint256 takerFee) {
        FeeInfo memory feeInfo = assetFeeInfo[asset];
        if (feeInfo.set) {
            return (feeInfo.makerFee, feeInfo.takerFee);
        }
        return (defaultMakerFee, defaultTakerFee);
    }

    /// @inheritdoc IOrderbookDex
    function setAssetFeeInfo(address asset, uint256 makerFee, uint256 takerFee) public onlyOwner {
        if (makerFee > maxFee || takerFee > maxFee) {
            revert FeeTooHigh();
        }
        assetFeeInfo[asset] = FeeInfo({makerFee: makerFee, takerFee: takerFee, set: true});
        emit FeeInfoChanged(asset, makerFee, takerFee);
    }

    /// @inheritdoc IOrderbookDex
    function setDefaultFeeInfo(uint256 makerFee, uint256 takerFee) public onlyOwner {
        if (makerFee > maxFee || takerFee > maxFee) {
            revert FeeTooHigh();
        }
        defaultMakerFee = makerFee;
        defaultTakerFee = takerFee;
        emit FeeInfoChanged(address(0), makerFee, takerFee);
    }

    /// @inheritdoc IOrderbookDex
    function setOrderCreationFee(uint256 fee) public onlyOwner {
        emit OrderCreationFeeChanged(orderCreationFee, fee);
        orderCreationFee = fee;
    }

    /// @inheritdoc IOrderbookDex
    function getOrder(address asset, uint256 orderId) public view virtual returns (Order memory) {
        return orders[asset][orderId];
    }

    /// @inheritdoc IOrderbookDex
    function createSellOrder(
        address asset,
        uint256 assetId,
        uint256 assetAmount,
        uint256 pricePerAsset
    ) external payable virtual nonReentrant returns (uint256) {
        if (msg.value < orderCreationFee) {
            revert InsufficientPayment();
        }
        return _createSellOrder(asset, assetId, assetAmount, pricePerAsset);
    }

    /// @inheritdoc IOrderbookDex
    function createBatchSellOrder(
        address asset,
        uint256[] memory assetIds,
        uint256[] memory assetAmounts,
        uint256[] memory pricesPerAssets
    ) external payable virtual nonReentrant returns (uint256[] memory) {
        if (assetIds.length != assetAmounts.length || assetIds.length != pricesPerAssets.length) {
            revert InvalidArrayLength();
        }
        if (msg.value < orderCreationFee * assetIds.length) {
            revert InsufficientPayment();
        }
        uint256[] memory orderIds = new uint256[](assetIds.length);
        for (uint256 i; i < assetIds.length; ) {
            orderIds[i] = _createSellOrder(
                asset,
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
        address asset,
        uint256 minimumAsset,
        uint256[] memory orderIds
    ) external payable virtual nonReentrant {
        uint256 length = orderIds.length;
        uint256 remainingEth = msg.value;
        uint256 totalAssetReceived;
        for (uint256 i; i < length; ++i) {
            uint256 orderId = orderIds.unsafeMemoryAccess(i);
            Order storage order = orders[asset][orderId];
            if (order.assetAmount == 0) {
                continue;
            }

            uint256 purchaseCost = (remainingEth * basisPoints) / (order.takerFee + basisPoints);
            // After the integer division by fees, purchase cost needs to be rounded up (fees are rounded down)
            if (purchaseCost * (order.takerFee + basisPoints) != (remainingEth * basisPoints)) {
                ++purchaseCost;
            }
            uint256 assetsToBuy = purchaseCost / order.pricePerAsset;

            if (assetsToBuy == 0) {
                continue;
            }
            if (assetsToBuy > order.assetAmount) {
                assetsToBuy = order.assetAmount;
                purchaseCost = assetsToBuy * order.pricePerAsset;
            }

            // Can be unchecked because assetsToBuy is less than or equal to order.assetAmount.
            unchecked {
                order.assetAmount -= assetsToBuy;
            }

            uint256 makerFee = (purchaseCost * order.makerFee) / basisPoints;
            uint256 takerFee = (purchaseCost * order.takerFee) / basisPoints;

            if (remainingEth < purchaseCost + takerFee) {
                revert InsufficientPayment();
            }

            // Can be unchecked because (purchaseCost + takerFee) is less than or equal to remainingEth.
            unchecked {
                remainingEth -= (purchaseCost + takerFee);
            }

            totalAssetReceived += assetsToBuy;
            IInverseProjected1155(asset).safeTransferFrom(
                address(this),
                msg.sender,
                order.assetId,
                assetsToBuy,
                bytes("")
            );
            order.seller.sendValue(purchaseCost - makerFee);
            emit OrderFilled(
                asset,
                order.assetId,
                orderId,
                order.seller,
                msg.sender,
                assetsToBuy,
                order.pricePerAsset,
                makerFee,
                takerFee
            );
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
        address asset,
        uint256 assetAmount,
        uint256[] memory orderIds
    ) external payable virtual nonReentrant {
        uint256 length = orderIds.length;
        uint256 remainingAsset = assetAmount;
        uint256 remainingEth = msg.value;
        for (uint256 i; i < length; ++i) {
            uint256 orderId = orderIds.unsafeMemoryAccess(i);
            Order storage order = orders[asset][orderId];
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

            // Can be unchecked because assetsToBuy is less than or equal to order.assetAmount.
            unchecked {
                order.assetAmount -= assetsToBuy;
            }

            uint256 purchaseCost = assetsToBuy * order.pricePerAsset;
            uint256 makerFee = (purchaseCost * order.makerFee) / basisPoints;
            uint256 takerFee = (purchaseCost * order.takerFee) / basisPoints;

            if (remainingEth < purchaseCost + takerFee) {
                revert InsufficientPayment();
            }

            // Can be unchecked because (purchaseCost + takerFee) is less than or equal to remainingEth.
            unchecked {
                remainingEth -= (purchaseCost + takerFee);
            }
            // Can be unchecked because assetsToBuy is less than or equal to remainingAsset.
            unchecked {
                remainingAsset -= assetsToBuy;
            }

            IInverseProjected1155(asset).safeTransferFrom(
                address(this),
                msg.sender,
                order.assetId,
                assetsToBuy,
                bytes("")
            );
            order.seller.sendValue(purchaseCost - makerFee);
            emit OrderFilled(
                asset,
                order.assetId,
                orderId,
                order.seller,
                msg.sender,
                assetsToBuy,
                order.pricePerAsset,
                makerFee,
                takerFee
            );
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
    function cancelSellOrder(address asset, uint256 orderId) external virtual nonReentrant {
        _cancelSellOrder(asset, orderId);
    }

    /// @inheritdoc IOrderbookDex
    function cancelBatchSellOrder(
        address asset,
        uint256[] memory orderIds
    ) external virtual nonReentrant {
        for (uint256 i; i < orderIds.length; ) {
            _cancelSellOrder(asset, orderIds.unsafeMemoryAccess(i));
            unchecked {
                ++i;
            }
        }
    }

    /// @inheritdoc IOrderbookDex
    function withdrawFees() external onlyOwner {
        uint256 amount = address(this).balance;
        payable(owner()).sendValue(amount);
        emit FeesWithdrawn(owner(), amount);
    }

    /// @dev Returns true if this contract implements the interface defined by `interfaceId`. See EIP165.
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155Holder, IERC165) returns (bool) {
        return
            interfaceId == type(IOrderbookDex).interfaceId || super.supportsInterface(interfaceId);
    }

    function _createSellOrder(
        address asset,
        uint256 assetId,
        uint256 assetAmount,
        uint256 pricePerAsset
    ) internal virtual returns (uint256) {
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
        (uint256 makerFee, uint256 takerFee) = getAssetAppliedFees(asset);
        Order memory newOrder = Order({
            assetId: assetId,
            assetAmount: assetAmount,
            pricePerAsset: pricePerAsset,
            seller: payable(msg.sender),
            makerFee: makerFee,
            takerFee: takerFee
        });
        uint256 orderId = currentOrderId[asset];
        orders[asset][orderId] = newOrder;
        emit OrderCreated(
            asset,
            assetId,
            orderId,
            msg.sender,
            assetAmount,
            pricePerAsset,
            makerFee,
            takerFee
        );
        ++currentOrderId[asset];
        return orderId;
    }

    function _cancelSellOrder(address asset, uint256 orderId) internal virtual {
        Order storage order = orders[asset][orderId];
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
        emit OrderCancelled(asset, order.assetId, orderId);
    }
}
