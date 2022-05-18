// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract SolarBear is ERC1155, AccessControl, Pausable {
    uint public constant SOLAR_BEAR = 0;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    address public immutable sbrenContract;
    mapping(uint => bool) public tokenClaims;

    constructor(string memory _uri, address _sbrenContract) ERC1155(_uri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        sbrenContract = _sbrenContract;
    }

    function mint(uint[] memory tokenIds) public whenNotPaused {        
        for (uint i = 0; i < tokenIds.length; i++) {
            require(tokenClaims[tokenIds[i]] == false, "Token has been claimed");
            require(IERC721(sbrenContract).ownerOf(tokenIds[i]) == msg.sender, "Sender is not a token owner");
            tokenClaims[tokenIds[i]] = true;
        }
        _mint(msg.sender, SOLAR_BEAR, tokenIds.length, "");
    }

    function setURI(string memory newuri) public onlyRole(OPERATOR_ROLE) {
        _setURI(newuri);
    }

    function pause() public onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getTokenIds(address account) public view returns (uint[] memory){
        uint256 balance = IERC721Enumerable(sbrenContract).balanceOf(account);
        uint[] memory tokenIds = new uint[](balance);
        for (uint i = 0; i < balance; i++) {
            tokenIds[i] = IERC721Enumerable(sbrenContract).tokenOfOwnerByIndex(account, i);
        }
        return tokenIds;
    }

    function getFilteredTokenIds(bool minted, address account) public view returns (uint[] memory){
        uint[] memory tokenIds = getTokenIds(account);
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
