import { ethers } from 'hardhat';
import { GAS_PRICE } from '../constants';
import { deploySoulbondWarPets, getSbrenContract } from '../utils/deployment';

// const sbrenAddress = '0x5b60c4D406F95bE4DA2d9f6b45e459F9F98d5Db4';
const sbrenAddress = undefined;
const gasPrice = GAS_PRICE;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const sbren = await getSbrenContract(sbrenAddress);
  console.log('SBREN at:', sbren.address);

  const soulbondWarPets = await deploySoulbondWarPets('Soulbond - War Pets', sbren.address, { gasPrice });
  console.log('SoulbondWarPets deployed to:', soulbondWarPets.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
