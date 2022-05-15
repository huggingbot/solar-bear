import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const etherscanApiKey = process.env.ETHERSCAN_API_KEY ?? '';
const coinmarketcapApiKey = process.env.COINMARKETCAP_API_KEY ?? '';

const gasReporterGasPriceApiKey = etherscanApiKey ? `&apikey=${etherscanApiKey}` : '';
const gasReporterCoinmarketcapApiKey = coinmarketcapApiKey ? { coinmarketcap: coinmarketcapApiKey } : {};

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
      },
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'MYR',
    token: 'ETH',
    gasPriceApi: `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice${gasReporterGasPriceApiKey}`,
    ...gasReporterCoinmarketcapApiKey,
  },
  etherscan: {
    apiKey: etherscanApiKey,
  },
};

export default config;
