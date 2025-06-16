import { Injectable, Logger, Module } from '@nestjs/common';

@Injectable()
export class PlanzaLoggerService {
  // constructor(@InjectSentry() private readonly client: SentryService) {}

  getLogger(context: string) {
    const logger = new Logger(context);
    return {
      error: this.error(logger),
      info: this.info(logger),
    };
  }

  error = (logger: Logger) => (operation: string, message: string, error?: Error) => {
    // if (error) this.client.instance().captureException(error);
    // else this.client.instance().captureMessage(`${operation.toUpperCase()} --> ${message}`, Severity.Error);
    return logger.error(`${operation.toUpperCase()} --> ${message}`, error);
  };

  info = (logger: Logger) => (operation: string, message: string, context?: Record<string, unknown>) => {
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return logger.log(`${operation.toUpperCase()} --> ${message}${contextStr}`);
  };
}

@Module({
  providers: [PlanzaLoggerService],
  exports: [PlanzaLoggerService],
})
export class PlanzaLoggerModule {}

