import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlanzaLoggerModule } from '../core/utils/logger.service';
import { PrismaModule } from '../prisma.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  providers: [UserService],
  imports: [PrismaModule, AuthModule, PlanzaLoggerModule],
  controllers: [UserController],
})
export class UserModule {}

