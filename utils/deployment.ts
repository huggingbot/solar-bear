import { Overrides } from 'ethers';
import { ethers } from 'hardhat';
import { SBREN_CONTRACT_ADDRESS, SOLAR_BEAR_TOKEN_URI } from '../constants';
import { SBREN } from '../typechain';

export const getSbrenContract = async (): Promise<SBREN> => {
  return await ethers.getContractAt('SBREN', SBREN_CONTRACT_ADDRESS);
};

export const deploySolarBear = async (
  sbrenAddress: string,
  override?: Overrides & { from?: string | Promise<string> }
) => {
  const SolarBear = await ethers.getContractFactory('SolarBear');
  const solarBear = await SolarBear.deploy(SOLAR_BEAR_TOKEN_URI, sbrenAddress, override);
  await solarBear.deployed();
  return solarBear;
};
