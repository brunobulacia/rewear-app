// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GarmentNFT
 * @dev Pasaporte digital inmutable para prendas verificadas en ReWear.
 *      Solo la plataforma (owner) puede emitir pasaportes.
 */
contract GarmentNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // garmentId (off-chain UUID) → tokenId on-chain
    mapping(string => uint256) public garmentToken;
    // tokenId → garmentId
    mapping(uint256 => string) public tokenGarment;

    event PassportMinted(
        string indexed garmentId,
        uint256 indexed tokenId,
        address indexed owner
    );

    event PassportTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    constructor(address initialOwner)
        ERC721("ReWear Garment Passport", "RWGP")
        Ownable(initialOwner)
    {}

    /**
     * @dev Mintea un pasaporte NFT para una prenda verificada.
     * @param to       Dirección del vendedor (primer dueño del NFT)
     * @param garmentId UUID de la prenda en la base de datos off-chain
     * @param tokenURI_ URI JSON con metadata de la prenda (IPFS o API)
     */
    function mintPassport(
        address to,
        string calldata garmentId,
        string calldata tokenURI_
    ) external onlyOwner returns (uint256) {
        require(garmentToken[garmentId] == 0, "GarmentNFT: already minted");
        require(to != address(0), "GarmentNFT: invalid address");

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        garmentToken[garmentId] = tokenId;
        tokenGarment[tokenId] = garmentId;

        emit PassportMinted(garmentId, tokenId, to);
        return tokenId;
    }

    /**
     * @dev Transfiere el pasaporte al comprador al completarse una venta.
     *      Solo la plataforma puede ejecutar la transferencia.
     */
    function transferPassport(address to, uint256 tokenId) external onlyOwner {
        address from = ownerOf(tokenId);
        _transfer(from, to, tokenId);
        emit PassportTransferred(tokenId, from, to);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
