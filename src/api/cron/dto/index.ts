import { ApiProperty } from '@nestjs/swagger';

export class CronTestResponse {
    @ApiProperty()
    ok: boolean;

    @ApiProperty({ description: 'ISO date time' })
    ranAt: string;
}
