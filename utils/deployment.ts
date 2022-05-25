import { Overrides } from 'ethers';
import { ethers } from 'hardhat';
import { WAR_PET_ID, SBREN_CONTRACT_ADDRESS, SOULBOND_WAR_PETS_TOKEN_URI } from '../constants';
import { SBREN, SoulbondWarPets } from '../typechain';

export const getSbrenContract = async (address = SBREN_CONTRACT_ADDRESS): Promise<SBREN> => {
  return await ethers.getContractAt('SBREN', address);
};

export const deploySbren = async (
  ownerAddress: string,
  override: Overrides & { from?: string | Promise<string> } = {}
): Promise<SBREN> => {
  const SBREN = await ethers.getContractFactory('SBREN');
  const sbren = await SBREN.deploy(
    'Soulbond - Ren Empire',
    'SBREN',
    'ipfs://QmNXTanDbZqf1xP5a3RnzcNEeBtSatoCP31Mc8UhRxcbz9/',
    'ipfs://QmNV4rMvay1kjCoiZ8kbbXLwJYANGHfZjMFznwJZ1U3rGa/hidden_metadata.json',
    ownerAddress,
    ownerAddress,
    ownerAddress,
    override
  );
  await sbren.deployed();
  return sbren;
};

export const deploySoulbondWarPets = async (
  _name: string,
  sbrenAddress: string,
  override: Overrides & { from?: string | Promise<string> } = {}
): Promise<SoulbondWarPets> => {
  const SoulbondWarPets = await ethers.getContractFactory('SoulbondWarPets');
  const soulbondWarPets = await SoulbondWarPets.deploy(
    _name,
    SOULBOND_WAR_PETS_TOKEN_URI,
    sbrenAddress,
    WAR_PET_ID,
    override
  );
  await soulbondWarPets.deployed();
  return soulbondWarPets;
};
