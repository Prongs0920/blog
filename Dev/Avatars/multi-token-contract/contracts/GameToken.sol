// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC721, Ownable {

    struct Avatar {
        uint256 price;
        string name;
        string fileName;
        bool isForSale;
    }

    // Array to store avatars
    Avatar[] public avatars;

    // Mapping from token ID to Avatar
    mapping(uint256 => Avatar) private _tokenIdToAvatar;

    // Mapping from token ID to owner
    mapping(uint256 => address) public avatarToOwner;

    // Mapping from owner to number of avatars owned
    mapping(address => uint256) public ownerAvatarCount;

    // Current token ID
    uint256 private _currentTokenId;

    // Mapping to track if a token ID exists
    mapping(uint256 => bool) private _tokenExists;

    event AvatarMinted(uint256 tokenId, string name, string fileName, uint256 price);
    event AvatarPriceUpdated(uint256 tokenId, uint256 newPrice);
    event AvatarListedForSale(uint256 tokenId, uint256 price);
    event AvatarUnlisted(uint256 tokenId);
    event AvatarPurchased(uint256 tokenId, address newOwner, uint256 price);
    event AvatarTransferred(uint256 tokenId, address from, address to);

    constructor() ERC721("GameToken", "Token")  Ownable(msg.sender){
        _currentTokenId = 0;
    }

    modifier onlyAvatarOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the avatar");
        _;
    }

    modifier onlyForSale(uint256 tokenId) {
        require(_tokenIdToAvatar[tokenId].isForSale, "Avatar is not for sale");
        _;
    }

    modifier avatarExists(uint256 tokenId) {
        require(_tokenExists[tokenId], "Avatar does not exist");
        _;
    }

    function mintAvatar(string memory name, string memory fileName, uint256 price) external onlyOwner {
        uint256 tokenId = _currentTokenId;
        _currentTokenId++;

        Avatar memory newAvatar = Avatar({
            price: price,
            name: name,
            fileName: fileName,
            isForSale: false
        });

        avatars.push(newAvatar);
        _tokenIdToAvatar[tokenId] = newAvatar;
        _tokenExists[tokenId] = true;

        _mint(msg.sender, tokenId);
        avatarToOwner[tokenId] = msg.sender;
        ownerAvatarCount[msg.sender]++;

        emit AvatarMinted(tokenId, name, fileName, price);
    }

    function avatarList() external view returns(Avatar[] memory) {
        return avatars;
    }
    
    // New function to get avatars owned by msg.sender
    function getMyAvatars() external view returns (Avatar[] memory, uint ) {
        uint256 totalOwned = ownerAvatarCount[msg.sender];
        Avatar[] memory ownedAvatars = new Avatar[](totalOwned);

        uint256 count = 0;
        for (uint256 i = 0; i < _currentTokenId; i++) {
            if (avatarToOwner[i] == msg.sender) {
                ownedAvatars[count] = _tokenIdToAvatar[i];
                count++;
            }
        }

        return (ownedAvatars, totalOwned);
    }

    function setAvatarPrice(uint256 tokenId, uint256 newPrice) external onlyAvatarOwner(tokenId) avatarExists(tokenId) {
        _tokenIdToAvatar[tokenId].price = newPrice;

        emit AvatarPriceUpdated(tokenId, newPrice);
    }

    function listAvatarForSale(uint256 tokenId, uint256 price) external onlyAvatarOwner(tokenId) avatarExists(tokenId) {
        _tokenIdToAvatar[tokenId].isForSale = true;
        _tokenIdToAvatar[tokenId].price = price;

        emit AvatarListedForSale(tokenId, price);
    }

    function unlistAvatar(uint256 tokenId) external onlyAvatarOwner(tokenId) avatarExists(tokenId) {
        _tokenIdToAvatar[tokenId].isForSale = false;

        emit AvatarUnlisted(tokenId);
    }

    function buyAvatar(uint256 tokenId) external payable onlyForSale(tokenId) avatarExists(tokenId) {
        Avatar memory avatar = _tokenIdToAvatar[tokenId];
        require(msg.value >= avatar.price, "Insufficient ETH sent");
        address owner = ownerOf(tokenId);
        require(owner != msg.sender, "Cannot buy your own avatar");

        _transfer(owner, msg.sender, tokenId);
        payable(owner).transfer(msg.value);

        _tokenIdToAvatar[tokenId].isForSale = false;
        avatarToOwner[tokenId] = msg.sender;
        ownerAvatarCount[owner]--;
        ownerAvatarCount[msg.sender]++;

        emit AvatarPurchased(tokenId, msg.sender, avatar.price);
    }

    function getAvatar(uint256 tokenId) external view avatarExists(tokenId) returns (Avatar memory) {
        return _tokenIdToAvatar[tokenId];
    }

    function transferAvatar(uint256 tokenId, address to) external onlyAvatarOwner(tokenId) avatarExists(tokenId) {
        require(to != address(0), "Invalid address");

        _transfer(msg.sender, to, tokenId);

        // Update the avatar's owner mapping
        avatarToOwner[tokenId] = to;
        ownerAvatarCount[msg.sender]--;
        ownerAvatarCount[to]++;

        // Update the avatar's owner field
        // _tokenIdToAvatar[tokenId].owner = to;

        emit AvatarTransferred(tokenId, msg.sender, to);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
