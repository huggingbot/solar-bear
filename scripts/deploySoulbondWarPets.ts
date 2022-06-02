import { ethers } from 'hardhat';
import { GAS_PRICE, SBREN_CONTRACT_ADDRESS } from '../constants';
import { deploySoulbondWarPets, getSbrenContract } from '../utils/deployment';

const gasPrice = GAS_PRICE;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const sbren = await getSbrenContract(SBREN_CONTRACT_ADDRESS);
  console.log('SBREN at:', sbren.address);

  const soulbondWarPets = await deploySoulbondWarPets({ override: { gasPrice } });
  console.log('SoulbondWarPets deployed to:', soulbondWarPets.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
