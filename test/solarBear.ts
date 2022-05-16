import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { ethers, network } from 'hardhat';
import { SBREN, SolarBear } from '../typechain';

describe('SolarBear contract', function () {
  let sbren: SBREN;
  let solarBear: SolarBear;
  let tokenOwner: string;
  let nonTokenOwner: string;

  let overrideTokenOwnership: (tokenId: number) => Promise<void>;
  let overrideAddressDataBalance: (balance: number) => Promise<void>;

  const tokenUri = 'https://token-cdn-domain/{id}.json';

  this.beforeAll(async () => {
    sbren = await ethers.getContractAt('SBREN', '0xaCc2Fcc87F57C52F945E3F373B32264E76DcFF84');

    tokenOwner = await sbren.ownerOf(BigNumber.from(0));
    nonTokenOwner = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
    const balanceToSet = utils.hexStripZeros(utils.parseEther('100').toHexString());

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [tokenOwner],
    });
    await network.provider.send('hardhat_setBalance', [tokenOwner, balanceToSet]);

    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [nonTokenOwner],
    });
    await network.provider.send('hardhat_setBalance', [nonTokenOwner, balanceToSet]);

    overrideTokenOwnership = async (tokenId: number) => {
      const ownershipStorageSlot = 4;
      const index = utils.solidityKeccak256(['uint256', 'uint256'], [tokenId, ownershipStorageSlot]);

      const timestamp = Math.floor(new Date().getTime() / 1000);
      const packed = utils.solidityPack(['uint64', 'address'], [timestamp, tokenOwner]);
      const value = utils.hexZeroPad(packed, 32);

      await ethers.provider.send('hardhat_setStorageAt', [sbren.address, index, value]);
    };

    overrideAddressDataBalance = async (balance: number) => {
      const addressDataStorageSlot = 5;
      const index = utils.solidityKeccak256(['uint256', 'uint256'], [tokenOwner, addressDataStorageSlot]);

      const storage = await ethers.provider.getStorageAt(sbren.address, index);
      const minted = ethers.utils.hexDataSlice(storage, 0, 16);
      const packedValue = utils.solidityPack(['uint128', 'uint128'], [minted, balance]);

      await ethers.provider.send('hardhat_setStorageAt', [sbren.address, index, packedValue]);
    };
  });

  this.beforeEach(async () => {
    const SolarBear = await ethers.getContractFactory('SolarBear');
    solarBear = await SolarBear.deploy(tokenUri, sbren.address);
    await solarBear.deployed();
  });

  describe('deployment', () => {
    it('should have the correct uri passed in from the constructor', async () => {
      expect(await solarBear.uri('0')).to.equal(tokenUri);
    });

    it('should have the correct sbren contract address passed in from the constructor', async () => {
      expect(await solarBear.sbrenContract()).to.equal(sbren.address);
    });
  });

  describe('mint method', () => {
    it('should mint successfully if sender is owner and token id has not been claimed', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await solarBear.connect(signer).mint([BigNumber.from(0)]);
      };
      const solarBearTokenId = await solarBear.SOLAR_BEAR();

      expect(await solarBear.balanceOf(tokenOwner, solarBearTokenId)).to.be.equal(0);
      await expect(mint()).to.not.be.reverted;
      expect(await solarBear.balanceOf(tokenOwner, solarBearTokenId)).to.be.equal(1);
    });

    it('should pass and no transfer made if no token id is given', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await solarBear.connect(signer).mint([]);
      };
      const solarBearTokenId = await solarBear.SOLAR_BEAR();

      expect(await solarBear.balanceOf(tokenOwner, solarBearTokenId)).to.be.equal(0);
      await expect(mint()).to.not.be.reverted;
      expect(await solarBear.balanceOf(tokenOwner, solarBearTokenId)).to.be.equal(0);
    });

    it('should fail if sender is not owner', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(nonTokenOwner);
        await solarBear.connect(signer).mint([BigNumber.from(0)]);
      };

      await expect(mint()).to.be.revertedWith('Sender is not a token owner');
    });

    it('should fail if token id has been claimed', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        const tx = await solarBear.connect(signer).mint([BigNumber.from(0)]);
        await tx.wait();

        await solarBear.connect(signer).mint([BigNumber.from(0)]);
      };

      await expect(mint()).to.be.revertedWith('Token has been claimed');
    });

    it('should fail if token id given is out of scope', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await solarBear.connect(signer).mint([BigNumber.from(1000000)]);
      };

      await expect(mint()).to.be.revertedWith('ERC721A: owner query for nonexistent token');
    });

    it('should fail if sender is not owner for all token ids passed in', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await solarBear.connect(signer).mint([BigNumber.from(0), BigNumber.from(9999)]);
      };

      expect(await sbren.ownerOf(BigNumber.from(9999))).to.not.be.equal(tokenOwner);
      await expect(mint()).to.be.revertedWith('Sender is not a token owner');
    });

    it('should fail if either one of the token ids passed in has been claimed', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        const tx = await solarBear.connect(signer).mint([BigNumber.from(1)]);
        await tx.wait();

        await solarBear.connect(signer).mint([BigNumber.from(0), BigNumber.from(1)]);
      };

      await expect(overrideTokenOwnership(1)).to.not.be.reverted;
      expect(await sbren.ownerOf(BigNumber.from(1))).to.be.equal(tokenOwner);
      await expect(mint()).to.be.revertedWith('Token has been claimed');
    });
  });

  describe('getTokenIds', () => {
    it('should return token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tokenIds = await solarBear.connect(signer).getTokenIds();

      expect(tokenIds).to.have.deep.members([BigNumber.from(0)]);
    });

    it('should return token ids owned by an address', async () => {
      await expect(overrideTokenOwnership(1)).to.not.be.reverted;
      await expect(overrideAddressDataBalance(2)).to.not.be.reverted;
      expect(await sbren.ownerOf(BigNumber.from(1))).to.be.equal(tokenOwner);

      const signer = await ethers.getSigner(tokenOwner);
      const tokenIds = await solarBear.connect(signer).getTokenIds();

      expect(tokenIds).to.have.deep.members([BigNumber.from(0), BigNumber.from(1)]);
    });

    it('should return empty array if no token id is owned by an address', async () => {
      const signer = await ethers.getSigner(nonTokenOwner);
      const tokenIds = await solarBear.connect(signer).getTokenIds();

      expect(tokenIds).to.have.deep.members([]);
    });
  });

  describe('getFilteredTokenIds', () => {
    beforeEach(async () => {
      await expect(overrideTokenOwnership(1)).to.not.be.reverted;
      await expect(overrideAddressDataBalance(2)).to.not.be.reverted;
      expect(await sbren.ownerOf(BigNumber.from(1))).to.be.equal(tokenOwner);
    });

    it('should return non-minted token ids owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tokenIds = await solarBear.connect(signer).getFilteredTokenIds(false);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0), BigNumber.from(1)]);
    });

    it('should return non-minted token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await solarBear.connect(signer).mint([BigNumber.from(0)]);
      await tx.wait();

      const tokenIds = await solarBear.connect(signer).getFilteredTokenIds(false);

      expect(tokenIds).to.have.deep.members([BigNumber.from(1)]);
    });

    it('should return an empty array of non-minted token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await solarBear.connect(signer).mint([BigNumber.from(0), BigNumber.from(1)]);
      await tx.wait();

      const tokenIds = await solarBear.connect(signer).getFilteredTokenIds(false);

      expect(tokenIds).to.have.deep.members([]);
    });

    it('should return an empty array of minted token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tokenIds = await solarBear.connect(signer).getFilteredTokenIds(true);

      expect(tokenIds).to.have.deep.members([]);
    });

    it('should return minted token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await solarBear.connect(signer).mint([BigNumber.from(0)]);
      await tx.wait();

      const tokenIds = await solarBear.connect(signer).getFilteredTokenIds(true);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0)]);
    });

    it('should return minted token ids owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await solarBear.connect(signer).mint([BigNumber.from(0), BigNumber.from(1)]);
      await tx.wait();

      const tokenIds = await solarBear.connect(signer).getFilteredTokenIds(true);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0), BigNumber.from(1)]);
    });
  });
});
