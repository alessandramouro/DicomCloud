import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsEmail, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(255) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(['TENANT_ADMIN','CLINIC_ADMIN','OPERATOR','PHYSICIAN','READONLY']) role?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clinicId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() permissions?: string[];
  @ApiPropertyOptional() @IsOptional() @IsEnum(['ACTIVE','INACTIVE','SUSPENDED']) status?: string;
}
