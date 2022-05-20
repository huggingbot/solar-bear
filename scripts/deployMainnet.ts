import { ethers } from 'hardhat';
import { GAS_PRICE } from '../constants';
import { deploySolarBear, getSbrenContract } from '../utils/deployment';

const gasPrice = GAS_PRICE;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const sbren = await getSbrenContract();
  console.log('SBREN at:', sbren.address);

  const solarBear = await deploySolarBear(sbren.address, { gasPrice });
  console.log('SolarBear deployed to:', solarBear.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
