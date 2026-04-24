"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");
dotenv.config();
const config = {
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
exports.default = config;
//# sourceMappingURL=hardhat.config.js.map