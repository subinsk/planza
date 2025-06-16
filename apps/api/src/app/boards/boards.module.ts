import { Module } from '@nestjs/common';
import { PlanzaLoggerModule } from '../core/utils/logger.service';
import { PrismaModule } from '../prisma.module';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';

@Module({
  controllers: [BoardsController],
  providers: [BoardsService],
  imports: [PrismaModule, PlanzaLoggerModule],
})
export class BoardsModule {}

