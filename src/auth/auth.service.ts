import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    async login(dto: LoginDto): Promise<any> {
        
    }

    async register(dto: RegisterDto): Promise<any> {
        console.log(dto,"::dto");
    }
}
