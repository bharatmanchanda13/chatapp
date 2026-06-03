import { Controller, Get, Post } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller('master-data')
export class MasterDataController {
    constructor(
        private readonly masterDataService: MasterDataService
    ) {}
    
    @Get()
    get() {
        return this.masterDataService.getList();
    }
}
