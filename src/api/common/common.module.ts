import { Module } from '@nestjs/common';
import { StorageModule } from 'src/services/storage';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

@Module({
    imports: [StorageModule],
    controllers: [CommonController],
    providers: [CommonService],
})
export class CommonModule {}
