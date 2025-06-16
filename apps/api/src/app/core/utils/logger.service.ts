import { Injectable, Logger, Module } from '@nestjs/common';

@Injectable()
export class PlanzaLoggerService {
  // constructor(@InjectSentry() private readonly client: SentryService) {}

  getLogger(context: string) {
    const logger = new Logger(context);
    return {
      error: this.error(logger),
    };
  }

  error = (logger: Logger) => (operation: string, message: string, error?: Error) => {
    // if (error) this.client.instance().captureException(error);
    // else this.client.instance().captureMessage(`${operation.toUpperCase()} --> ${message}`, Severity.Error);
    return logger.error(`${operation.toUpperCase()} --> ${message}`, error);
  };
}

@Module({
  providers: [PlanzaLoggerService],
  exports: [PlanzaLoggerService],
})
export class PlanzaLoggerModule {}

