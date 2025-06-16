import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlanzaLoggerModule } from '../core/utils/logger.service';
import { PrismaModule } from '../prisma.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  providers: [OrganizationService],
  controllers: [OrganizationController],
  imports: [PrismaModule, AuthModule, PlanzaLoggerModule],
})
export class OrganizationModule {}

