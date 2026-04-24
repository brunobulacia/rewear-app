import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as GarmentNFTAbi from './abi/GarmentNFT.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private contract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const privateKey = this.config.get<string>('PLATFORM_WALLET_PRIVATE_KEY');
    const contractAddress = this.config.get<string>('NFT_CONTRACT_ADDRESS');
    const rpcUrl =
      this.config.get<string>('POLYGON_AMOY_RPC') ||
      'https://rpc-amoy.polygon.technology';

    if (!privateKey || !contractAddress) {
      this.logger.warn(
        'NFT_CONTRACT_ADDRESS o PLATFORM_WALLET_PRIVATE_KEY no configurados. Minting deshabilitado.',
      );
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, GarmentNFTAbi, wallet);
      this.logger.log(`Blockchain service activo → contrato ${contractAddress}`);
    } catch (err) {
      this.logger.error('Error inicializando blockchain service', err);
    }
  }

  get isActive(): boolean {
    return this.contract !== null;
  }

  /**
   * Mintea un pasaporte NFT para la prenda aprobada.
   * @returns tokenId como string, o null si el contrato no está configurado
   */
  async mintPassport(
    ownerAddress: string,
    garmentId: string,
    tokenURI: string,
  ): Promise<string | null> {
    if (!this.contract) {
      this.logger.warn(`Mint saltado para prenda ${garmentId} — contrato no configurado`);
      return null;
    }

    try {
      this.logger.log(`Minteando pasaporte para prenda ${garmentId} → ${ownerAddress}`);
      const tx = await this.contract.mintPassport(ownerAddress, garmentId, tokenURI);
      const receipt = await tx.wait();

      // Extraer tokenId del evento PassportMinted
      let tokenId: string | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = this.contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === 'PassportMinted') {
            tokenId = parsed.args.tokenId.toString();
            break;
          }
        } catch {
          // log no parseado
        }
      }

      this.logger.log(`✅ NFT #${tokenId} minteado para prenda ${garmentId}`);
      return tokenId;
    } catch (err) {
      this.logger.error(`Error minteando NFT para prenda ${garmentId}`, err);
      return null;
    }
  }

  async getContractAddress(): Promise<string | null> {
    if (!this.contract) return null;
    return await this.contract.getAddress();
  }

  async getTotalSupply(): Promise<number> {
    if (!this.contract) return 0;
    try {
      const total = await this.contract.totalSupply();
      return Number(total);
    } catch {
      return 0;
    }
  }
}
