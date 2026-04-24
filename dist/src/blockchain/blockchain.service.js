"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BlockchainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const GarmentNFTAbi = require("./abi/GarmentNFT.json");
let BlockchainService = BlockchainService_1 = class BlockchainService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(BlockchainService_1.name);
        this.contract = null;
        this.provider = null;
    }
    onModuleInit() {
        const privateKey = this.config.get('PLATFORM_WALLET_PRIVATE_KEY');
        const contractAddress = this.config.get('NFT_CONTRACT_ADDRESS');
        const rpcUrl = this.config.get('POLYGON_AMOY_RPC') ||
            'https://rpc-amoy.polygon.technology';
        if (!privateKey || !contractAddress) {
            this.logger.warn('NFT_CONTRACT_ADDRESS o PLATFORM_WALLET_PRIVATE_KEY no configurados. Minting deshabilitado.');
            return;
        }
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
            this.contract = new ethers_1.ethers.Contract(contractAddress, GarmentNFTAbi, wallet);
            this.logger.log(`Blockchain service activo → contrato ${contractAddress}`);
        }
        catch (err) {
            this.logger.error('Error inicializando blockchain service', err);
        }
    }
    get isActive() {
        return this.contract !== null;
    }
    async mintPassport(ownerAddress, garmentId, tokenURI) {
        if (!this.contract) {
            this.logger.warn(`Mint saltado para prenda ${garmentId} — contrato no configurado`);
            return null;
        }
        try {
            this.logger.log(`Minteando pasaporte para prenda ${garmentId} → ${ownerAddress}`);
            const tx = await this.contract.mintPassport(ownerAddress, garmentId, tokenURI);
            const receipt = await tx.wait();
            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsed = this.contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data,
                    });
                    if (parsed?.name === 'PassportMinted') {
                        tokenId = parsed.args.tokenId.toString();
                        break;
                    }
                }
                catch {
                }
            }
            this.logger.log(`✅ NFT #${tokenId} minteado para prenda ${garmentId}`);
            return tokenId;
        }
        catch (err) {
            this.logger.error(`Error minteando NFT para prenda ${garmentId}`, err);
            return null;
        }
    }
    async getContractAddress() {
        if (!this.contract)
            return null;
        return await this.contract.getAddress();
    }
    async getTotalSupply() {
        if (!this.contract)
            return 0;
        try {
            const total = await this.contract.totalSupply();
            return Number(total);
        }
        catch {
            return 0;
        }
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = BlockchainService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map