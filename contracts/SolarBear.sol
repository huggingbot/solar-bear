//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'hardhat/console.sol';

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

contract SolarBear is ERC1155 {
    constructor(string memory _uri) ERC1155(_uri) {
        console.log('Deploying SolarBear');
    }
}
