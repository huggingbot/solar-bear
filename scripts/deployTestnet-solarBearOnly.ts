import { ethers } from 'hardhat';

const gasPrice = ethers.utils.parseUnits('40', 'gwei');
const solarBearTokenUri = 'https://token-cdn-domain/{id}.json';

const sbrenAddress = "0x5b60c4D406F95bE4DA2d9f6b45e459F9F98d5Db4";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  
  console.log('SBREN deployed to:', sbrenAddress);

  const SolarBear = await ethers.getContractFactory('SolarBear');
  const solarBear = await SolarBear.deploy(solarBearTokenUri, sbrenAddress, { gasPrice });

  await solarBear.deployed();
  console.log('SolarBear deployed to:', solarBear.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
