import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RootController } from './root.controller';
import { RootService } from './root.service';

describe('RootController', () => {
    let rootController: RootController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule],
            controllers: [RootController],
            providers: [RootService],
        }).compile();

        rootController = app.get<RootController>(RootController);
    });

    describe('root', () => {
        it('should response equal {ok:true}', () => {
            expect(rootController.healthCheck()).toEqual({ ok: true });
        });
    });
});
