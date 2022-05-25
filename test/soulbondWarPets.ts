import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { ethers, network } from 'hardhat';
import { GAS_PRICE, SOULBOND_WAR_PETS_NAME, SOULBOND_WAR_PETS_TOKEN_URI, WAR_PET_ID } from '../constants';
import { SBREN, SoulbondWarPets } from '../typechain';
import { deploySbren, deploySoulbondWarPets, getSbrenContract } from '../utils/deployment';

describe('SoulbondWarPets contract', function () {
  let sbren: SBREN;
  let soulbondWarPets: SoulbondWarPets;
  let tokenOwner: string;
  let nonTokenOwner: string;

  let overrideTokenOwnership: (tokenId: number, contractAddress?: string) => Promise<void>;
  let overrideAddressDataBalance: (balance: number, contractAddress?: string) => Promise<void>;

  const operatorRole = utils.solidityKeccak256(['bytes'], [utils.hexlify(utils.toUtf8Bytes('OPERATOR_ROLE'))]);
  const tokenUri = SOULBOND_WAR_PETS_TOKEN_URI;

  this.beforeAll(async () => {
    sbren = await getSbrenContract();

    tokenOwner = '0xa54d3c09e34ac96807c1cc397404bf2b98dc4efb';
    nonTokenOwner = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';
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

    await overrideTokenOwnership(0);
    await overrideAddressDataBalance(1);
  });

  this.beforeEach(async () => {
    const gasPrice = GAS_PRICE;
    soulbondWarPets = await deploySoulbondWarPets(SOULBOND_WAR_PETS_NAME, sbren.address, { gasPrice });
  });

  describe('deployment', () => {
    it('should have the correct name passed in from the constructor', async () => {
      expect(await soulbondWarPets.name()).to.equal(SOULBOND_WAR_PETS_NAME);
    });

    it('should have the correct uri passed in from the constructor', async () => {
      expect(await soulbondWarPets.uri('0')).to.equal(tokenUri);
    });

    it('should have the correct active contract address passed in from the constructor', async () => {
      expect(await soulbondWarPets.activeContract()).to.equal(sbren.address);
    });

    it('should have the correct war pet token id passed in from the constructor', async () => {
      expect(await soulbondWarPets.warPetId()).to.equal(WAR_PET_ID);
    });

    it('should have the default admin role set to msg.sender', async () => {
      const [deployer] = await ethers.getSigners();

      expect(await soulbondWarPets.hasRole(ethers.constants.HashZero, deployer.address)).to.equal(true);
    });

    it('should have the operator role set to msg.sender', async () => {
      const [deployer] = await ethers.getSigners();

      expect(await soulbondWarPets.hasRole(operatorRole, deployer.address)).to.equal(true);
    });

    it('should not be paused initially', async () => {
      expect(await soulbondWarPets.paused()).to.be.equal(false);
    });
  });

  describe('mint method', () => {
    it('should mint successfully if sender is owner and token id has not been claimed', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      };
      const soulbondWarPetsTokenId = await soulbondWarPets.warPetId();

      expect(await soulbondWarPets.balanceOf(tokenOwner, soulbondWarPetsTokenId)).to.be.equal(0);
      await expect(mint()).to.not.be.reverted;
      expect(await soulbondWarPets.balanceOf(tokenOwner, soulbondWarPetsTokenId)).to.be.equal(1);
    });

    it('should pass and no transfer made if no token id is given', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await soulbondWarPets.connect(signer).mint([]);
      };
      const soulbondWarPetsTokenId = await soulbondWarPets.warPetId();

      expect(await soulbondWarPets.balanceOf(tokenOwner, soulbondWarPetsTokenId)).to.be.equal(0);
      await expect(mint()).to.not.be.reverted;
      expect(await soulbondWarPets.balanceOf(tokenOwner, soulbondWarPetsTokenId)).to.be.equal(0);
    });

    it('should fail if sender is not owner', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(nonTokenOwner);
        await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      };

      await expect(mint()).to.be.revertedWith('Sender is not a token owner');
    });

    it('should fail if token id has been claimed', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
        await tx.wait();

        await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      };

      await expect(mint()).to.be.revertedWith('Token has been claimed');
    });

    it('should fail if token id given is out of scope', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await soulbondWarPets.connect(signer).mint([BigNumber.from(1000000)]);
      };

      await expect(mint()).to.be.revertedWith('panic code 0x32 (Array accessed at an out-of-bounds or negative index)');
    });

    it('should fail if sender is not owner for all token ids passed in', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await soulbondWarPets.connect(signer).mint([BigNumber.from(0), BigNumber.from(9999)]);
      };

      expect(await sbren.ownerOf(BigNumber.from(9999))).to.not.be.equal(tokenOwner);
      await expect(mint()).to.be.revertedWith('Sender is not a token owner');
    });

    it('should fail if either one of the token ids passed in has been claimed', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(1)]);
        await tx.wait();

        await soulbondWarPets.connect(signer).mint([BigNumber.from(0), BigNumber.from(1)]);
      };

      await expect(overrideTokenOwnership(1)).to.not.be.reverted;
      expect((await sbren.ownerOf(BigNumber.from(1))).toLowerCase()).to.be.equal(tokenOwner);
      await expect(mint()).to.be.revertedWith('Token has been claimed');
    });

    it('should fail running mint method when paused', async () => {
      const mint = async () => {
        const signer = await ethers.getSigner(tokenOwner);
        await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      };
      const tx = await soulbondWarPets.pause();
      await tx.wait();

      await expect(mint()).to.be.revertedWith('Pausable: paused');
    });
  });

  describe('switchNation', () => {
    it('should update active contract and war pet id', async () => {
      const randomAddress = '0x5b60c4D406F95bE4DA2d9f6b45e459F9F98d5Db4';

      expect(await soulbondWarPets.activeContract()).to.be.equal(sbren.address);
      expect(await soulbondWarPets.warPetId()).to.be.equal(WAR_PET_ID);

      await soulbondWarPets.switchNation(randomAddress, 1);

      expect(await soulbondWarPets.activeContract()).to.be.equal(randomAddress);
      expect(await soulbondWarPets.warPetId()).to.be.equal(1);
    });

    it('should be able to mint the same token id after switching active contract and war pet id', async () => {
      const tokenOwnerSigner = await ethers.getSigner(tokenOwner);
      const [deployer] = await ethers.getSigners();
      const mint = async () => await soulbondWarPets.connect(tokenOwnerSigner).mint([BigNumber.from(0)]);

      const otherSbren = await deploySbren(deployer.address);
      await (await otherSbren.pause(false)).wait();
      await (await otherSbren.whiteListUserArrayWithIdList1([tokenOwner])).wait();
      await (await otherSbren.connect(tokenOwnerSigner).mint(1, { value: utils.parseEther('0.01') })).wait();

      await expect(mint()).to.not.be.reverted;

      await soulbondWarPets.switchNation(otherSbren.address, 1);

      await expect(mint()).to.not.be.reverted;
    });

    it('should be able to mint the same token id after switching only active contract', async () => {
      const tokenOwnerSigner = await ethers.getSigner(tokenOwner);
      const [deployer] = await ethers.getSigners();
      const mint = async () => await soulbondWarPets.connect(tokenOwnerSigner).mint([BigNumber.from(0)]);

      const otherSbren = await deploySbren(deployer.address);
      await (await otherSbren.pause(false)).wait();
      await (await otherSbren.whiteListUserArrayWithIdList1([tokenOwner])).wait();
      await (await otherSbren.connect(tokenOwnerSigner).mint(1, { value: utils.parseEther('0.01') })).wait();

      await expect(mint()).to.not.be.reverted;

      await soulbondWarPets.switchNation(otherSbren.address, 0);

      await expect(mint()).to.not.be.reverted;
    });

    it('should not be able to mint the same token id after switching only war pet id', async () => {
      const tokenOwnerSigner = await ethers.getSigner(tokenOwner);
      const mint = async () => await soulbondWarPets.connect(tokenOwnerSigner).mint([BigNumber.from(0)]);

      await expect(mint()).to.not.be.reverted;

      await soulbondWarPets.switchNation(sbren.address, 1);

      await expect(mint()).to.be.revertedWith('Token has been claimed');
    });

    it('should not be able to mint the same token id after switching same active contract and war pet id', async () => {
      const tokenOwnerSigner = await ethers.getSigner(tokenOwner);
      const mint = async () => await soulbondWarPets.connect(tokenOwnerSigner).mint([BigNumber.from(0)]);

      await expect(mint()).to.not.be.reverted;

      await soulbondWarPets.switchNation(sbren.address, 0);

      await expect(mint()).to.be.revertedWith('Token has been claimed');
    });
  });

  describe('getTokenIds', () => {
    it('should return token id owned by an address', async () => {
      const tokenIds = await soulbondWarPets.getTokenIds(tokenOwner);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0)]);
    });

    it('should return token ids owned by an address', async () => {
      await expect(overrideTokenOwnership(1)).to.not.be.reverted;
      await expect(overrideAddressDataBalance(2)).to.not.be.reverted;
      expect((await sbren.ownerOf(BigNumber.from(1))).toLowerCase()).to.be.equal(tokenOwner);

      const tokenIds = await soulbondWarPets.getTokenIds(tokenOwner);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0), BigNumber.from(1)]);
    });

    it('should return empty array if no token id is owned by an address', async () => {
      const tokenIds = await soulbondWarPets.getTokenIds(nonTokenOwner);
      expect(tokenIds).to.have.deep.members([]);
    });

    it('should return nothing if sent AddressZero as an address', async () => {
      await expect(soulbondWarPets.getTokenIds(ethers.constants.AddressZero)).to.be.revertedWith(
        'balance query for the zero address'
      );
    });
  });

  describe('getFilteredTokenIds', () => {
    beforeEach(async () => {
      await expect(overrideTokenOwnership(1)).to.not.be.reverted;
      await expect(overrideAddressDataBalance(2)).to.not.be.reverted;
      expect((await sbren.ownerOf(BigNumber.from(1))).toLowerCase()).to.be.equal(tokenOwner);
    });

    it('should return non-minted token ids owned by an address', async () => {
      const tokenIds = await soulbondWarPets.getFilteredTokenIds(false, tokenOwner);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0), BigNumber.from(1)]);
    });

    it('should return non-minted token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      await tx.wait();

      const tokenIds = await soulbondWarPets.getFilteredTokenIds(false, tokenOwner);

      expect(tokenIds).to.have.deep.members([BigNumber.from(1)]);
    });

    it('should return an empty array of non-minted token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(0), BigNumber.from(1)]);
      await tx.wait();

      const tokenIds = await soulbondWarPets.getFilteredTokenIds(false, tokenOwner);

      expect(tokenIds).to.have.deep.members([]);
    });

    it('should return an empty array of minted token id owned by an address', async () => {
      const tokenIds = await soulbondWarPets.getFilteredTokenIds(true, tokenOwner);

      expect(tokenIds).to.have.deep.members([]);
    });

    it('should return minted token id owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      await tx.wait();

      const tokenIds = await soulbondWarPets.getFilteredTokenIds(true, tokenOwner);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0)]);
    });

    it('should return minted token ids owned by an address', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(0), BigNumber.from(1)]);
      await tx.wait();

      const tokenIds = await soulbondWarPets.getFilteredTokenIds(true, tokenOwner);

      expect(tokenIds).to.have.deep.members([BigNumber.from(0), BigNumber.from(1)]);
    });
  });

  describe('authorization', () => {
    it('should allow only operator role to call setURI', async () => {
      const signer = await ethers.getSigner(tokenOwner);

      await expect(soulbondWarPets.connect(signer).setURI('')).to.be.revertedWith(
        `AccessControl: account ${signer.address.toLowerCase()} is missing role ${operatorRole}`
      );
    });

    it('should allow only operator role to call pause', async () => {
      const signer = await ethers.getSigner(tokenOwner);

      await expect(soulbondWarPets.connect(signer).pause()).to.be.revertedWith(
        `AccessControl: account ${signer.address.toLowerCase()} is missing role ${operatorRole}`
      );
    });

    it('should allow only operator role to call unpause', async () => {
      const signer = await ethers.getSigner(tokenOwner);

      await expect(soulbondWarPets.connect(signer).unpause()).to.be.revertedWith(
        `AccessControl: account ${signer.address.toLowerCase()} is missing role ${operatorRole}`
      );
    });

    it('should allow only operator role to call switchNation', async () => {
      const signer = await ethers.getSigner(tokenOwner);

      await expect(soulbondWarPets.connect(signer).switchNation(sbren.address, WAR_PET_ID)).to.be.revertedWith(
        `AccessControl: account ${signer.address.toLowerCase()} is missing role ${operatorRole}`
      );
    });
  });

  describe('transfer', () => {
    it('should be able to do transfer when contract is paused', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      await tx.wait();
      const tx2 = await soulbondWarPets.pause();
      await tx2.wait();
      expect(await soulbondWarPets.balanceOf(tokenOwner, BigNumber.from(0))).to.be.equal(1);
      expect(await soulbondWarPets.balanceOf(nonTokenOwner, BigNumber.from(0))).to.be.equal(0);
      await soulbondWarPets
        .connect(signer)
        .safeTransferFrom(tokenOwner, nonTokenOwner, BigNumber.from(0), BigNumber.from(1), []);
      expect(await soulbondWarPets.balanceOf(tokenOwner, BigNumber.from(0))).to.be.equal(0);
      expect(await soulbondWarPets.balanceOf(nonTokenOwner, BigNumber.from(0))).to.be.equal(1);
    });

    it('should be able to do transfer when contract is not paused', async () => {
      const signer = await ethers.getSigner(tokenOwner);
      const tx = await soulbondWarPets.connect(signer).mint([BigNumber.from(0)]);
      await tx.wait();
      expect(await soulbondWarPets.balanceOf(tokenOwner, BigNumber.from(0))).to.be.equal(1);
      expect(await soulbondWarPets.balanceOf(nonTokenOwner, BigNumber.from(0))).to.be.equal(0);
      await soulbondWarPets
        .connect(signer)
        .safeTransferFrom(tokenOwner, nonTokenOwner, BigNumber.from(0), BigNumber.from(1), []);
      expect(await soulbondWarPets.balanceOf(tokenOwner, BigNumber.from(0))).to.be.equal(0);
      expect(await soulbondWarPets.balanceOf(nonTokenOwner, BigNumber.from(0))).to.be.equal(1);
    });
  });
});
