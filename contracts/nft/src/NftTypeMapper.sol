pragma solidity ^0.8.13;

import {NftType} from "./NftType.sol";

contract NftTypeMapper {
    mapping(NftType => string) internal nftTypeToString;

    constructor() {
        nftTypeToString[NftType.GORILLA] = "gorilla";
        nftTypeToString[NftType.ANACONDA] = "anaconda";
        nftTypeToString[NftType.JAGUAR] = "jaguar";
    }

    function getNftTypeString(NftType nftType) external view returns (string memory) {
        return nftTypeToString[nftType];
    }
}