import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Identifier must be a string' })
  @IsNotEmpty({ message: 'Email, username or phone is required' })
  identifier: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsOptional()
  @IsBoolean({ message: 'Remember me must be a boolean' })
  rememberMe?: boolean;
}
