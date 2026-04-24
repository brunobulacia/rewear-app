import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying GarmentNFT with:', deployer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'MATIC');

  const GarmentNFT = await ethers.getContractFactory('GarmentNFT');
  const contract = await GarmentNFT.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('\n✅ GarmentNFT desplegado en:', address);
  console.log('\nAgregar a .env:');
  console.log(`NFT_CONTRACT_ADDRESS="${address}"`);
  console.log(`PLATFORM_WALLET_ADDRESS="${deployer.address}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
