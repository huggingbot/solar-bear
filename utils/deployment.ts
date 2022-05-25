import { Overrides } from 'ethers';
import { ethers } from 'hardhat';
import { ACTIVE_WAR_PET_TOKEN_ID, SBREN_CONTRACT_ADDRESS, SOULBOND_WAR_PETS_TOKEN_URI } from '../constants';
import { SBREN, SoulbondWarPets } from '../typechain';

export const getSbrenContract = async (address = SBREN_CONTRACT_ADDRESS): Promise<SBREN> => {
  return await ethers.getContractAt('SBREN', address);
};

export const deploySoulbondWarPets = async (
  _name: string,
  sbrenAddress: string,
  override?: Overrides & { from?: string | Promise<string> }
): Promise<SoulbondWarPets> => {
  const SoulbondWarPets = await ethers.getContractFactory('SoulbondWarPets');
  const soulbondWarPets = await SoulbondWarPets.deploy(
    _name,
    SOULBOND_WAR_PETS_TOKEN_URI,
    sbrenAddress,
    ACTIVE_WAR_PET_TOKEN_ID,
    override
  );
  await soulbondWarPets.deployed();
  return soulbondWarPets;
};
