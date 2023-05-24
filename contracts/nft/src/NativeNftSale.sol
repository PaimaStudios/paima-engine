pragma solidity ^0.8.13;

import "./Nft.sol";
import {NftType} from "./NftType.sol";
import "./NftTypeMapper.sol";
import "./BaseState.sol";
import "./ERC1967.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract NativeNftSale is BaseState, ERC1967, Ownable {
    using Address for address payable;

    NftTypeMapper public typeMapper;

    event Initialized(address indexed owner, address indexed nft);

    event UpdatePrice(uint256 indexed oldPrice, uint256 indexed newPrice);

    event UpdateNftProxy(address indexed oldProxy, address indexed newProxy);

    event BuyNFT(
        uint256 indexed tokenId,
        uint256 indexed PRICE,
        address indexed receiver,
        address buyer
    );

    function initialize(address owner, address _nft, uint256 _price) public {
        require(!initialized, "Contract already initialized");
        initialized = true;

        nftPrice = _price;
        nftAddress = _nft;
        typeMapper = new NftTypeMapper();
        _transferOwnership(owner);

        emit Initialized(owner, _nft);
    }

    function buyNft(
        address receiverAddress,
        NftType nftType
    ) external payable returns (uint256) {
        require(msg.value == nftPrice, "NativeNftSale: incorrect value");
        require(
            receiverAddress != address(0),
            "NativeNftSale: zero receiver address"
        );

        uint256 price = nftPrice;

        uint256 tokenId = Nft(nftAddress).mint(
            receiverAddress,
            typeMapper.getNftTypeString(nftType)
        );

        emit BuyNFT(tokenId, price, receiverAddress, msg.sender);

        return tokenId;
    }

    function updatePrice(uint256 _nftPrice) external onlyOwner {
        uint256 oldPrice = nftPrice;
        nftPrice = _nftPrice;

        emit UpdatePrice(oldPrice, _nftPrice);
    }

    function withdraw(address payable _account) external onlyOwner {
        uint256 balance = address(this).balance;

        require(balance > 0, "NativeNftSale: 0 balance");
        _account.sendValue(balance);
    }

    function upgradeContract(address _newContract) external onlyOwner {
        _setImplementation(_newContract);
    }

    receive() external payable {}
}
