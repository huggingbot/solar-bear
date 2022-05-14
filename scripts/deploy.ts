// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat';

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
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
  );

  await sbren.deployed();
  console.log('SBREN deployed to:', sbren.address);

  const SolarBear = await ethers.getContractFactory('SolarBear');
  const solarBear = await SolarBear.deploy('https://token-cdn-domain/{id}.json', sbren.address);

  await solarBear.deployed();
  console.log('SolarBear deployed to:', solarBear.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
