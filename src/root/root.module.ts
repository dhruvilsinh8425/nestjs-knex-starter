import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { RootController } from './root.controller';
import { RootService } from './root.service';

@Module({
    imports: [ConfigModule, TerminusModule, HttpModule],
    controllers: [RootController],
    providers: [RootService],
})
export class RootModule {}
