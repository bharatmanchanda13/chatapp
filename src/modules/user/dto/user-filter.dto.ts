import { Gender, RelationshipStatus} from '@prisma/client';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
    name?: string;

    email?: string;

    phone?: string;

    gender?: Gender;

    relationshipStatus?: RelationshipStatus;

    isActive?: boolean;

    bio?: string;

    dob?: Date;

    weight?: number;

    height?: number;

    lookingFor?: string;

    interests?: string[];

    latitude?: number;

    longitude?: number;

}