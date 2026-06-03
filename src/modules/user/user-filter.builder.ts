import { Injectable } from '@nestjs/common';
import { UserFilterDto } from './dto/user-filter.dto';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { OnlineUserService } from '../chat/online-user.service';

@Injectable()
export class UserFilterBuilder {
    constructor(private readonly onlineUserService: OnlineUserService) {}

    build(dto: UserFilterDto, extra?: { friendIds?: number[]; currentUserId?: number }) {
        let latitudeFilter: any = undefined;
        let longitudeFilter: any = undefined;

        if (dto.latitude !== undefined && dto.longitude !== undefined) {
            const radius = dto.radius || 10; // Default 10km
            const latRange = radius / 111.0;
            const lonRange = radius / (111.0 * Math.cos(dto.latitude * (Math.PI / 180.0)));

            latitudeFilter = {
                gte: dto.latitude - latRange,
                lte: dto.latitude + latRange,
            };
            longitudeFilter = {
                gte: dto.longitude - lonRange,
                lte: dto.longitude + lonRange,
            };
        }

        let idFilter: any = undefined;
        const conditions: any[] = [];

        if (dto.online !== undefined) {
            const onlineUserIds = this.onlineUserService.getOnlineUsers();
            if (dto.online) {
                conditions.push({ in: onlineUserIds });
            } else {
                conditions.push({ notIn: onlineUserIds });
            }
        }

        if (dto.isFriend !== undefined && extra?.friendIds) {
            if (dto.isFriend) {
                conditions.push({ in: extra.friendIds });
            } else {
                conditions.push({ notIn: extra.friendIds });
            }
        }

        if (conditions.length > 0) {
            const combinedFilter: any = {};
            for (const cond of conditions) {
                if (cond.in) {
                    if (combinedFilter.in) {
                        combinedFilter.in = combinedFilter.in.filter((x: any) => cond.in.includes(x));
                    } else {
                        combinedFilter.in = cond.in;
                    }
                }
                if (cond.notIn) {
                    if (combinedFilter.notIn) {
                        combinedFilter.notIn = [...new Set([...combinedFilter.notIn, ...cond.notIn])];
                    } else {
                        combinedFilter.notIn = cond.notIn;
                    }
                }
            }
            idFilter = combinedFilter;
        }

        if (extra?.currentUserId) {
            if (!idFilter) {
                idFilter = { notIn: [extra.currentUserId] };
            } else {
                if (idFilter.notIn) {
                    idFilter.notIn = [...new Set([...idFilter.notIn, extra.currentUserId])];
                } else {
                    idFilter.notIn = [extra.currentUserId];
                }
            }
        }

        return {
            id: idFilter,

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

                interests: PrismaFilter.in(dto.interests),

                latitude: latitudeFilter,

                longitude: longitudeFilter,

            },
        };
    }
}