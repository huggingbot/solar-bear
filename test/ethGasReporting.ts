import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { ethers, network } from 'hardhat';
import { SBREN, SoulbondWarPets } from '../typechain';
import { GAS_PRICE, SOULBOND_WAR_PETS_NAME } from '../constants';
import { deploySoulbondWarPets } from '../utils/deployment';

xdescribe('eth gas reporting', function () {
  let sbren: SBREN;
  let soulbondWarPets: SoulbondWarPets;

  this.beforeAll(async () => {
    sbren = await ethers.getContractAt('SBREN', '0xaCc2Fcc87F57C52F945E3F373B32264E76DcFF84');
  });

  this.beforeEach(async () => {
    const gasPrice = GAS_PRICE;
    soulbondWarPets = await deploySoulbondWarPets(SOULBOND_WAR_PETS_NAME, sbren.address, { gasPrice });

    const tx = await soulbondWarPets.unpause();
    await tx.wait();
  });

  describe('mint method', () => {
    let tokenOwner: string;

    this.beforeAll(async () => {
      tokenOwner = '0xa54d3c09e34ac96807c1cc397404bf2b98dc4efb';
      const balanceToSet = utils.hexStripZeros(utils.parseEther('100').toHexString());

      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tokenOwner],
      });
      await network.provider.send('hardhat_setBalance', [tokenOwner, balanceToSet]);
    });

    it('minting 1 token id', async () => {
      const overrideTokenOwner = async (tokenId: number) => {
        const ownershipStorageSlot = 4;
        const index = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [tokenId, ownershipStorageSlot]);

        const timestamp = Math.floor(new Date().getTime() / 1000);
        const packed = utils.solidityPack(['uint64', 'address'], [timestamp, tokenOwner]);
        const value = utils.hexZeroPad(packed, 32);

        await ethers.provider.send('hardhat_setStorageAt', [sbren.address, index, value]);
      };
      const mint = async (tokenId: number) => {
        const signer = await ethers.getSigner(tokenOwner);
        await soulbondWarPets.connect(signer).mint([BigNumber.from(tokenId)]);
      };

      const loops = 10;
      let successCount = 0;
      let tokenId = 0;

      while (successCount < loops) {
        try {
          await expect(overrideTokenOwner(tokenId)).to.not.be.reverted;
          await expect(mint(tokenId)).to.not.be.reverted;
          successCount++;
        } catch {
        } finally {
          tokenId++;
        }
      }
    });

    it('minting 2 token ids', async () => {
      const overrideTokenOwner = async (tokenId: number) => {
        const ownershipStorageSlot = 4;
        const index = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [tokenId, ownershipStorageSlot]);

        const timestamp = Math.floor(new Date().getTime() / 1000);
        const packed = utils.solidityPack(['uint64', 'address'], [timestamp, tokenOwner]);
        const value = utils.hexZeroPad(packed, 32);

        await ethers.provider.send('hardhat_setStorageAt', [sbren.address, index, value]);
      };

      const mint = async (tokenId1: number, tokenId2: number) => {
        const signer = await ethers.getSigner(tokenOwner);
        await soulbondWarPets.connect(signer).mint([BigNumber.from(tokenId1), BigNumber.from(tokenId2)]);
      };

      const loops = 10;
      let successCount = 0;
      let tokenId = 0;

      while (successCount < 10) {
        try {
          await expect(overrideTokenOwner(tokenId)).to.not.be.reverted;
          await expect(overrideTokenOwner(tokenId + loops)).to.not.be.reverted;
          await expect(mint(tokenId, tokenId + loops)).to.not.be.reverted;
          successCount++;
        } catch {
        } finally {
          tokenId++;
        }
      }
    });
  });
});
