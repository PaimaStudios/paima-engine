pragma solidity ^0.8.13;
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract Nft is ERC165, ERC721, Ownable {
    uint256 public currentTokenId;
    string public baseURI;
    uint256 public totalSupply;
    uint256 public maxSupply;
    string public baseExtension;

    mapping(address => bool) public minters;

    modifier canMint() {
        require(
            isMinter(msg.sender) || owner() == msg.sender,
            "NFT: not authorized to mint"
        );
        _;
    }

    modifier onlyExistingTokenId(uint256 tokenId) {
        require(_exists(tokenId), "Nft: non-existent tokenId");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(msg.sender == ownerOf(tokenId), "Nft: not owner");
        _;
    }

    event UpdateMaxSupply(
        uint256 indexed oldMaxSupply,
        uint256 indexed newMaxSupply
    );

    event SetMinter(address indexed newMinter);

    event RemoveMinter(address indexed oldMinter);

    event SetBaseURI(string indexed oldUri, string indexed newUri);

    event Minted(uint256 indexed tokenId, string initialData);

    /// @dev contract constructor
    /// @param name Collection name.
    /// @param symbol Collection symbol.
    /// @param owner The owner of the contract, who will be able to execute
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        address owner
    ) ERC721(name, symbol) {
        maxSupply = supply;
        currentTokenId = 1;
        baseExtension = ".json";
        transferOwnership(owner);
    }

    function supportsInterface(
        bytes4 interfaceID
    ) public pure override(ERC165, ERC721) returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // ERC165
            interfaceID == this.mint.selector; // ERC721 Paima-extended
    }

    function mint(
        address _to,
        string memory initialData
    ) external canMint returns (uint256) {
        require(maxSupply > totalSupply, "Nft: max supply reached");
        require(_to != address(0), "Nft: zero receiver address");

        uint256 tokenId = currentTokenId;
        _safeMint(_to, tokenId);

        totalSupply++;
        currentTokenId++;

        emit Minted(tokenId, initialData);
        return tokenId;
    }

    function burn(
        uint256 _tokenId
    ) external onlyExistingTokenId(_tokenId) onlyTokenOwner(_tokenId) {
        totalSupply--;
        _burn(_tokenId);
    }

    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Nft: invalid minter");

        minters[_minter] = true;
        emit SetMinter(_minter);
    }

    function removeMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Nft: invalid minter");

        minters[_minter] = false;
        emit RemoveMinter(_minter);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        string memory URI = super.tokenURI(tokenId);
        return string(abi.encodePacked(URI, baseExtension));
    }

    function setBaseURI(string memory _URI) external onlyOwner {
        string memory oldURI = baseURI;
        baseURI = _URI;
        emit SetBaseURI(oldURI, _URI);
    }

    function setBaseExtension(
        string memory _newBaseExtension
    ) public onlyOwner {
        baseExtension = _newBaseExtension;
    }

    function updateMaxSupply(uint256 _maxSupply) external onlyOwner {
        uint256 oldMaxSupply = maxSupply;
        require(
            _maxSupply > oldMaxSupply,
            "NFT: old supply less than new supply"
        );

        maxSupply = _maxSupply;
        emit UpdateMaxSupply(oldMaxSupply, _maxSupply);
    }

    function exists(uint256 _tokenId) external view returns (bool) {
        return _exists(_tokenId);
    }

    function isMinter(address _account) public view returns (bool) {
        return minters[_account];
    }
}
