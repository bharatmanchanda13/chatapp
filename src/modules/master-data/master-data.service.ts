import { Injectable } from '@nestjs/common';
import { Gender, RelationshipStatus, ReportReason, ReportType } from '@prisma/client';

@Injectable()
export class MasterDataService {
    constructor() {}

    getList() {
        return {
            data: [
                Gender,
                RelationshipStatus,
                ReportType,
                ReportReason,
            ],
        };
    }
}
