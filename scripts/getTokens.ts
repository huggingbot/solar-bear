import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

const warPetId = 0;
const bossAddress = '0x4f5e99cbe7d6f054c770d8292f8421b7e9db906c';

const getTokenIds = async (address: string): Promise<number[]> => {
  const sbrenAbi = [
    'function balanceOf(address owner) view returns (uint)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint)',
  ];
  const sbren = new ethers.Contract(
    '0xaCc2Fcc87F57C52F945E3F373B32264E76DcFF84',
    sbrenAbi,
    ethers.getDefaultProvider()
  );

  const balance: BigNumber = await sbren.balanceOf(address);
  const tokenIds: number[] = [];

  for (let i = 0; i < balance.toNumber(); i++) {
    const index: BigNumber = await sbren.tokenOfOwnerByIndex(address, i);
    tokenIds.push(index.toNumber());
  }
  return tokenIds;
};

const getFilteredTokenIds = async (minted: boolean, address: string): Promise<number[]> => {
  const tokenIds = await getTokenIds(address);

  const warPetAbi = ['function tokenClaims(uint warPetId, uint tokenId) view returns (bool)'];
  const warPet = new ethers.Contract(
    '0xeBd7d4184C7Cc0982165BE74AF3ad94486eBDbf2',
    warPetAbi,
    ethers.getDefaultProvider()
  );

  const filteredTokenIds: number[] = [];

  for (let i = 0; i < tokenIds.length; i++) {
    const hasMinted = await warPet.tokenClaims(warPetId, tokenIds[i]);
    if (hasMinted === minted) {
      filteredTokenIds.push(tokenIds[i]);
    }
  }
  return filteredTokenIds;
};

async function main() {
  const filteredTokenIds = await getFilteredTokenIds(true, bossAddress);
  console.log('filteredTokenIds', filteredTokenIds);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
