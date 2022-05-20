import { ethers } from 'hardhat';
import { GAS_PRICE } from '../constants';
import { deploySolarBear } from '../utils/deployment';

const gasPrice = GAS_PRICE;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const SBREN = await ethers.getContractFactory('SBREN');
  const sbren = await SBREN.deploy(
    'Soulbond - Ren Empire',
    'SBREN',
    'ipfs://QmNXTanDbZqf1xP5a3RnzcNEeBtSatoCP31Mc8UhRxcbz9/',
    'ipfs://QmNV4rMvay1kjCoiZ8kbbXLwJYANGHfZjMFznwJZ1U3rGa/hidden_metadata.json',
    deployer.address,
    deployer.address,
    deployer.address,
    { gasPrice }
  );

  await sbren.deployed();
  console.log('SBREN deployed to:', sbren.address);

  const solarBear = await deploySolarBear(sbren.address, { gasPrice });
  console.log('SolarBear deployed to:', solarBear.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
