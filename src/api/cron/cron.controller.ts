import { Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse } from 'src/exceptions/dto';
import { CronService } from './cron.service';
import { CronTestResponse } from './dto';

@ApiSecurity('X_API_KEY')
@ApiTags('Cron')
@ApiBadRequestResponse({
    description: 'Bad response',
    type: ApiErrorResponse,
})
@Controller('cron')
export class CronController {
    constructor(private readonly cronService: CronService) {}

    @Post('test')
    @ApiOperation({ summary: 'Run the test job now' })
    async runTest(): Promise<CronTestResponse> {
        return this.cronService.runTest();
    }
}
