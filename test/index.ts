import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SBREN, SolarBear } from '../typechain';

describe('SolarBear contract', function () {
  let sbren: SBREN;
  let solarBear: SolarBear;

  const tokenUri = 'https://token-cdn-domain/{id}.json';

  this.beforeAll(async () => {
    const name = 'Soulbond - Ren Empire';
    const symbol = 'SBREN';
    const baseUri = 'ipfs://QmNXTanDbZqf1xP5a3RnzcNEeBtSatoCP31Mc8UhRxcbz9/';
    const notRevealedUri = 'ipfs://QmNV4rMvay1kjCoiZ8kbbXLwJYANGHfZjMFznwJZ1U3rGa/hidden_metadata.json';
    const owner = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
    const admin = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
    const sysAdmin = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';

    const SBREN = await ethers.getContractFactory('SBREN');
    sbren = await SBREN.deploy(name, symbol, baseUri, notRevealedUri, owner, admin, sysAdmin);
    await sbren.deployed();
  });

  this.beforeEach(async () => {
    const SolarBear = await ethers.getContractFactory('SolarBear');
    solarBear = await SolarBear.deploy(tokenUri, sbren.address);
    await solarBear.deployed();
  });

  describe('Deployment', () => {
    it('Should have the correct uri passed in from the constructor', async () => {
      expect(await solarBear.uri('0')).to.equal(tokenUri);
    });

    it('Should have the correct sbren contract address passed in from the constructor', async () => {
      expect(await solarBear.sbrenContract()).to.equal(sbren.address);
    });
  });
});
