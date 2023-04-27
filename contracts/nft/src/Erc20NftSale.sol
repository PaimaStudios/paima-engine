// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Nft.sol";
import {NftType} from "./NftType.sol";
import "./NftTypeMapper.sol";
import "./State.sol";
import "./ERC1967.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract Erc20NftSale is State, ERC1967, Ownable {
    NftTypeMapper public typeMapper;

    event Initialized(
        ERC20[] indexed currencies,
        address indexed owner,
        address indexed nft
    );

    event UpdatePrice(uint256 indexed oldPrice, uint256 indexed newPrice);

    event UpdateNftProxy(address indexed oldProxy, address indexed newProxy);

    event RemoveWhiteListedToken(address indexed token);

    event WhiteListTokens(address[] indexed token);

    event BuyWithToken(
        uint256 indexed tokenId,
        uint256 indexed PRICE,
        address indexed receiver,
        address buyer
    );

    constructor() {
        typeMapper = new NftTypeMapper();
    }

    function initialize(
        ERC20[] memory currencies,
        address owner,
        address _nft,
        uint256 _price
    ) public {
        require(!initialized, "Contract already initialized");
        initialized = true;

        for (uint8 i = 0; i < currencies.length; i++) {
            supportedCurrencies.push(currencies[i]);
        }

        nftPrice = _price;
        nftAddress = _nft;
        _transferOwnership(owner);

        emit Initialized(currencies, owner, _nft);
    }

    /// @dev Purchases an NFT using approved token. NFTs are sold based on FIFO
    /// @param _tokenAddress Address of ERC20 token to use for payment
    function buyWithToken(ERC20 _tokenAddress, address receiverAddress, NftType nftType)
        external
        returns (uint256)
    {
        require(
            tokenIsWhitelisted(_tokenAddress),
            "NftSale: token not whitelisted"
        );

        uint256 price = nftPrice;

        // transfer tokens from buyer to contract
        ERC20(_tokenAddress).transferFrom(msg.sender, address(this), price);

        uint256 tokenId = Nft(nftAddress).mint(receiverAddress, typeMapper.getNftTypeString(nftType));

        if (!depositedCurrenciesMap[_tokenAddress]) {
            depositedCurrencies.push(_tokenAddress);
            depositedCurrenciesMap[_tokenAddress] = true;
        }

        emit BuyWithToken(tokenId, price, receiverAddress, msg.sender);

        return tokenId;
    }

    function removeWhitelistedToken(ERC20 _token) external onlyOwner {
        require(tokenIsWhitelisted(_token), "NftSale: token not whitelisted");

        ERC20[] memory supportedCurrenciesMem = supportedCurrencies;

        uint256 tokenIndex;
        for (uint256 i = 0; i < supportedCurrenciesMem.length; i++) {
            if (supportedCurrenciesMem[i] == _token) {
                tokenIndex = i;
                break;
            }
        }

        require(
            tokenIndex < supportedCurrenciesMem.length,
            "NftSale: out of bounds"
        );

        supportedCurrencies[tokenIndex] = supportedCurrencies[
            supportedCurrencies.length - 1
        ];
        supportedCurrencies.pop();

        emit RemoveWhiteListedToken(address(_token));
    }

    function whitelistTokens(ERC20[] memory _tokens) external onlyOwner {
        address[] memory newWhiteList = new address[](_tokens.length);

        for (uint256 i = 0; i < _tokens.length; i++) {
            newWhiteList[i] = address(_tokens[i]);
            supportedCurrencies.push(_tokens[i]);
        }

        emit WhiteListTokens(newWhiteList);
    }

    function updatePrice(uint256 _nftPrice) external onlyOwner {
        uint256 oldPrice = nftPrice;
        nftPrice = _nftPrice;

        emit UpdatePrice(oldPrice, _nftPrice);
    }

    function withdraw(address _account) external onlyOwner {
        ERC20[] memory currencies = depositedCurrencies;

        for (uint256 i = 0; i < currencies.length; ) {
            uint256 balance = currencies[i].balanceOf(address(this));
            if (balance > 0) {
                currencies[i].transfer(_account, balance);
            }

            depositedCurrenciesMap[currencies[i]] = false;

            unchecked {
                i++;
            }
        }

        delete depositedCurrencies;
    }

    function upgradeContract(address _newContract) external onlyOwner {
        _setImplementation(_newContract);
    }

    function tokenIsWhitelisted(ERC20 _token) public view returns (bool) {
        ERC20[] memory supportedCurrenciesMem = supportedCurrencies;
        for (uint256 i = 0; i < supportedCurrenciesMem.length; i++) {
            if (supportedCurrenciesMem[i] == _token) return true;
        }

        return false;
    }

    function getDepositedCurrencies() public view returns (ERC20[] memory) {
        return depositedCurrencies;
    }

    function getSupportedCurrencies() public view returns (ERC20[] memory) {
        return supportedCurrencies;
    }
}
