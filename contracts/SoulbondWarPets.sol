// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract SoulbondWarPets is ERC1155, AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    string public name;
    // address public activeContract;
    uint public warPetId;
    mapping(uint => address) public warPetToNation;
    mapping(uint => bool[10000]) public tokenClaims;

    constructor(
        string memory _name,
        string memory _uri, 
        address _activeContract,
        uint _warPetId
    ) ERC1155(_uri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        name = _name;
        warPetId = _warPetId;
        warPetToNation[_warPetId] = _activeContract;
    }

    function mint(uint[] memory tokenIds) public whenNotPaused {
        for (uint i = 0; i < tokenIds.length; i++) {
            require(tokenClaims[warPetId][tokenIds[i]] == false, "Token has been claimed");
            require(IERC721(warPetToNation[warPetId]).ownerOf(tokenIds[i]) == msg.sender, "Sender is not a token owner");
            tokenClaims[warPetId][tokenIds[i]] = true;
        }
        _mint(msg.sender, warPetId, tokenIds.length, "");
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

    function switchNation(address _activeContract, uint _warPetId) public onlyRole(OPERATOR_ROLE) {
        require(warPetToNation[_warPetId] == address(0), "This war pet belongs to other nation");
        warPetId = _warPetId;
        warPetToNation[_warPetId] = _activeContract;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getTokenIds(address account) public view returns (uint[] memory){
        uint256 balance = IERC721Enumerable(warPetToNation[warPetId]).balanceOf(account);
        uint[] memory tokenIds = new uint[](balance);
        for (uint i = 0; i < balance; i++) {
            tokenIds[i] = IERC721Enumerable(warPetToNation[warPetId]).tokenOfOwnerByIndex(account, i);
        }
        return tokenIds;
    }

    function getFilteredTokenIds(bool minted, address account) public view returns (uint[] memory){
        uint[] memory tokenIds = getTokenIds(account);
        uint counter = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            if(tokenClaims[warPetId][tokenIds[i]] == minted){                
                counter++;
            }
        }        
        uint[] memory filteredTokenIds = new uint[](counter);
        counter = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            if(tokenClaims[warPetId][tokenIds[i]] == minted){
                filteredTokenIds[counter] = tokenIds[i];
                counter++;
            }
        }     
        return filteredTokenIds;
    }
}