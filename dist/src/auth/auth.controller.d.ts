import { AuthService } from './auth.service';
import { VerifySignatureDto } from './dto/verify-signature.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    getNonce(address: string): Promise<{
        nonce: string;
    }>;
    verify(dto: VerifySignatureDto): Promise<{
        token: string;
        user: any;
    }>;
}
