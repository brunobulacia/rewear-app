'use client';

import { createConfig, http } from 'wagmi';
import { mainnet, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, mainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [polygonAmoy.id]: http(),
    [mainnet.id]: http(),
  },
});
