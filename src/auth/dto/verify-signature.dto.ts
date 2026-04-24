import { IsEthereumAddress, IsString } from 'class-validator';

export class VerifySignatureDto {
  @IsEthereumAddress()
  address: string;

  @IsString()
  signature: string;
}
