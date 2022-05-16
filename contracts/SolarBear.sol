//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";

contract SolarBear is Ownable, ERC1155Pausable {
    uint public constant SOLAR_BEAR = 0;
    address public immutable sbrenContract;
    mapping(uint => bool) public tokenClaims;

    constructor(string memory _uri, address _sbrenContract) ERC1155(_uri) {
        sbrenContract = _sbrenContract;
    }

    function mint(uint[] memory tokenIds) public {
         for (uint i = 0; i < tokenIds.length; i++) {
             require(tokenClaims[tokenIds[i]] == false, "Token has been claimed");
             require(IERC721(sbrenContract).ownerOf(tokenIds[i]) == msg.sender, "Sender is not a token owner");
             tokenClaims[tokenIds[i]] = true;
         }
        _mint(msg.sender, SOLAR_BEAR, tokenIds.length, "");
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function getTokenIds() public view returns (uint[] memory){
        uint256 balance = IERC721Enumerable(sbrenContract).balanceOf(msg.sender);
        uint[] memory tokenIds = new uint[](balance);
        for (uint i = 0; i < balance; i++) {
            tokenIds[i] = IERC721Enumerable(sbrenContract).tokenOfOwnerByIndex(msg.sender, i);
        }
        return tokenIds;
    }

    function getFilteredTokenIds(bool minted) public view returns (uint[] memory){
        uint[] memory tokenIds = getTokenIds();
        uint counter = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            if(tokenClaims[tokenIds[i]] == minted){                
                counter++;
            }
        }        
        uint[] memory filteredTokenIds = new uint[](counter);
        counter = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            if(tokenClaims[tokenIds[i]] == minted){
                filteredTokenIds[counter] = tokenIds[i];
                counter++;
            }
        }     
        return filteredTokenIds;
    }
}
