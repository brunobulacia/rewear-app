import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    amoy: {
      url: process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.PLATFORM_WALLET_PRIVATE_KEY
        ? [process.env.PLATFORM_WALLET_PRIVATE_KEY]
        : [],
    },
  },
};

export default config;
