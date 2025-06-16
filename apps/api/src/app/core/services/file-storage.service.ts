import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extension } from 'mime-types';
import { Client } from 'minio';
import { PlanzaLoggerService } from '../utils/logger.service';

@Injectable()
export class FileStorageService {
  private client: Client;
  private logger = this.planzaLogger.getLogger('FILE_STORAGE');
  constructor(private config: ConfigService, private planzaLogger: PlanzaLoggerService) {
    try {
      this.client = this.createMinioInstance();
    } catch (error) {
      this.logger.error('constructor', 'MinIO client initialization failed, file storage will be disabled', new Error(error.message));
      this.client = null;
    }
  }

  private createMinioInstance(): Client {
    const endPoint = this.config.get('FILE_STORAGE_URI');
    const accessKey = this.config.get('FILE_STORAGE_ACCESS_KEY');
    const secretKey = this.config.get('FILE_STORAGE_ACCESS_SECRET');
    
    // Skip if temp values or missing
    if (!endPoint || !accessKey || !secretKey || accessKey === 'temp_key') {
      throw new Error('File storage not configured');
    }
    
    return new Client({
      endPoint: endPoint,
      useSSL: !endPoint.includes('localhost'),
      pathStyle: true,
      region: 'ap-mumbai-1',
      accessKey: accessKey,
      secretKey: secretKey,
    });
  }

  async get(path: string) {
    if (!this.client) {
      this.logger.error('get', 'File storage not available', new Error('MinIO client not initialized'));
      return null;
    }
    const bucket = this.config.get('BUCKET');
    return this.client.getObject(bucket, path);
  }

  async upload(file: any, name: string, folder: string) {
    if (!this.client) {
      this.logger.error('upload', 'File storage not available', new Error('MinIO client not initialized'));
      return null;
    }
    const bucket = this.config.get('BUCKET');
    const fileName = `${folder}/${name}.${extension(file.mimetype)}`;
    try {
      const result = await this.client.putObject(bucket, fileName, file.buffer);
      return { result, filePath: fileName };
    } catch (error) {
      this.logger.error('upload', 'Failed to upload', error);
      return null;
    }
  }

  async delete(path: string) {
    if (!this.client) {
      this.logger.error('delete', 'File storage not available', new Error('MinIO client not initialized'));
      return false;
    }
    const bucket = this.config.get('BUCKET');
    try {
      await this.client.removeObject(bucket, path);
      return true;
    } catch (error) {
      this.logger.error('delete', 'Failed to delete object', error);
      return false;
    }
  }
}

