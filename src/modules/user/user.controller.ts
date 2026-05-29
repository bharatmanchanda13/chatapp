import { Controller, Get, Post, UseGuards, Delete, Put, Body, Param, Query } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RegisterDto } from '../auth/dto/register.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(AuthGuard)
    // @UseGuards(AuthGuard, RolesGuard)
    // @Roles(Role.ADMIN)
    @Get()
    async getList(@Query() pageDto: PaginationDto) {
        return this.userService.getList(pageDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Post()
    async create(@Body() dto: RegisterDto) {
        return this.userService.create(dto);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':id')
    async getOne(@Param('id') id: number) {
        return this.userService.getOne(id);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.userService.delete(id);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Put(':id')
    async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
        return this.userService.update(id, dto);
    }
}
