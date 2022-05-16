import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { ethers, network } from 'hardhat';
import { SBREN, SolarBear } from '../typechain';

xdescribe('eth gas reporting', function () {
  let sbren: SBREN;
  let solarBear: SolarBear;

  const tokenUri = 'https://token-cdn-domain/{id}.json';

  this.beforeAll(async () => {
    sbren = await ethers.getContractAt('SBREN', '0xaCc2Fcc87F57C52F945E3F373B32264E76DcFF84');
  });

  this.beforeEach(async () => {
    const SolarBear = await ethers.getContractFactory('SolarBear');
    solarBear = await SolarBear.deploy(tokenUri, sbren.address);
    await solarBear.deployed();
  });

  describe('mint method', () => {
    let tokenOwner: string;

    this.beforeAll(async () => {
      tokenOwner = await sbren.ownerOf(BigNumber.from(0));
      const balanceToSet = utils.hexStripZeros(utils.parseEther('100').toHexString());

      await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tokenOwner],
      });
      await network.provider.send('hardhat_setBalance', [tokenOwner, balanceToSet]);
    });

    it('minting 1 token id', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await solarBear.connect(signer).mint([BigNumber.from(0)]);
      };

      await expect(mint()).to.not.be.reverted;
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

      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await solarBear.connect(signer).mint([BigNumber.from(0), BigNumber.from(1)]);
      };

      await expect(overrideTokenOwner(1)).to.not.be.reverted;
      expect(await sbren.ownerOf(BigNumber.from(1))).to.be.equal(tokenOwner);
      await expect(mint()).to.not.be.reverted;
    });

    it('minting 3 token ids', async () => {
      const overrideTokenOwner = async (tokenId: number) => {
        const ownershipStorageSlot = 4;
        const index = ethers.utils.solidityKeccak256(['uint256', 'uint256'], [tokenId, ownershipStorageSlot]);

        const timestamp = Math.floor(new Date().getTime() / 1000);
        const packed = utils.solidityPack(['uint64', 'address'], [timestamp, tokenOwner]);
        const value = utils.hexZeroPad(packed, 32);

        await ethers.provider.send('hardhat_setStorageAt', [sbren.address, index, value]);
      };

      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await solarBear.connect(signer).mint([BigNumber.from(0), BigNumber.from(1), BigNumber.from(2)]);
      };

      await expect(overrideTokenOwner(1)).to.not.be.reverted;
      await expect(overrideTokenOwner(2)).to.not.be.reverted;
      expect(await sbren.ownerOf(BigNumber.from(1))).to.be.equal(tokenOwner);
      expect(await sbren.ownerOf(BigNumber.from(2))).to.be.equal(tokenOwner);
      await expect(mint()).to.not.be.reverted;
    });
  });
});
