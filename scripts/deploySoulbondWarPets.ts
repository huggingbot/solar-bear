import { ethers } from 'hardhat';
import { GAS_PRICE, SOULBOND_WAR_PETS_NAME } from '../constants';
import { deploySoulbondWarPets, getSbrenContract } from '../utils/deployment';

const sbrenAddress = '0x77de29A4f31a11D948f12760327174DF4D6FF22F';
// const sbrenAddress = undefined;
const gasPrice = GAS_PRICE;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const sbren = await getSbrenContract(sbrenAddress);
  console.log('SBREN at:', sbren.address);

  const soulbondWarPets = await deploySoulbondWarPets(SOULBOND_WAR_PETS_NAME, sbren.address, { gasPrice });
  console.log('SoulbondWarPets deployed to:', soulbondWarPets.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
