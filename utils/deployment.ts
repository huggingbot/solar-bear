import { Overrides } from 'ethers';
import { ethers } from 'hardhat';
import { ACTIVE_WAR_PET_TOKEN_ID, SBREN_CONTRACT_ADDRESS, SOLAR_BEAR_TOKEN_URI } from '../constants';
import { SBREN } from '../typechain';

export const getSbrenContract = async (): Promise<SBREN> => {
  return await ethers.getContractAt('SBREN', SBREN_CONTRACT_ADDRESS);
};

export const deploySolarBear = async (
  _name: string,
  sbrenAddress: string,
  override?: Overrides & { from?: string | Promise<string> }
) => {
  const SolarBear = await ethers.getContractFactory('SolarBear');
  const solarBear = await SolarBear.deploy(_name, SOLAR_BEAR_TOKEN_URI, sbrenAddress, ACTIVE_WAR_PET_TOKEN_ID, override);
  await solarBear.deployed();
  return solarBear;
};
