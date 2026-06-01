import { Injectable } from '@nestjs/common';
import { UserFilterDto } from './dto/user-filter.dto';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';

@Injectable()
export class UserFilterBuilder {
    build(dto: UserFilterDto) {
        return {
            role: 'USER',

            name: PrismaFilter.contains(dto.name),

            email: PrismaFilter.contains(dto.email),

            phone: PrismaFilter.contains(dto.phone),

            isActive: dto.isActive !== undefined ? dto.isActive : undefined,

            profile: {

                gender: PrismaFilter.equals(dto.gender),

                relationshipStatus: PrismaFilter.equals(dto.relationshipStatus),

                bio: PrismaFilter.contains(dto.bio),

                dob: PrismaFilter.dateRange(dto.dob, dto.dob),

                weight: PrismaFilter.equals(dto.weight),

                height: PrismaFilter.equals(dto.height),

                lookingFor: PrismaFilter.contains(dto.lookingFor),

                interests: PrismaFilter.in(dto.interests),

            },
        };
    }
}