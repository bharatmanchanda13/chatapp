import { IsNumber } from "class-validator";

export class JoinUserDto {
    @IsNumber()
    id: number;
}