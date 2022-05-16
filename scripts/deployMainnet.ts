// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat';

const gasPrice = ethers.utils.parseUnits('40', 'gwei');
const solarBearTokenUri = 'https://token-cdn-domain/{id}.json';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const sbren = await ethers.getContractAt('SBREN', '0xaCc2Fcc87F57C52F945E3F373B32264E76DcFF84');
  console.log('SBREN at:', sbren.address);

  const SolarBear = await ethers.getContractFactory('SolarBear');
  const solarBear = await SolarBear.deploy(solarBearTokenUri, sbren.address, { gasPrice });

  await solarBear.deployed();
  console.log('SolarBear deployed to:', solarBear.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
