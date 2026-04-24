import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class BlockchainService implements OnModuleInit {
    private config;
    private readonly logger;
    private contract;
    private provider;
    constructor(config: ConfigService);
    onModuleInit(): void;
    get isActive(): boolean;
    mintPassport(ownerAddress: string, garmentId: string, tokenURI: string): Promise<string | null>;
    getContractAddress(): Promise<string | null>;
    getTotalSupply(): Promise<number>;
}
