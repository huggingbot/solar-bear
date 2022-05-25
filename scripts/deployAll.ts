import { ethers } from 'hardhat';
import { GAS_PRICE, SOULBOND_WAR_PETS_NAME } from '../constants';
import { deploySbren, deploySoulbondWarPets } from '../utils/deployment';

const gasPrice = GAS_PRICE;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const sbren = await deploySbren(deployer.address, { gasPrice });
  console.log('SBREN deployed to:', sbren.address);

  const soulbondWarPets = await deploySoulbondWarPets(SOULBOND_WAR_PETS_NAME, sbren.address, { gasPrice });
  console.log('SoulbondWarPets deployed to:', soulbondWarPets.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
