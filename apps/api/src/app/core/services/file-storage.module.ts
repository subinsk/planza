import { Module } from '@nestjs/common';
import { PlanzaLoggerModule } from '../utils/logger.service';
import { FileStorageService } from './file-storage.service';
@Module({
  imports: [PlanzaLoggerModule],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}

