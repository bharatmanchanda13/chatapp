import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator"

export class UpdateUserDto {
    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @IsPhoneNumber('IN')
    phone: string;
};

export class BlockUserDto {
    @IsOptional()
    @IsString()
    reason?: string;
}