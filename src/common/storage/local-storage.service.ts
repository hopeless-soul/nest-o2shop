/// <reference types="multer" />
import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly uploadRoot = path.join(process.cwd(), 'uploads');

  async save(file: Express.Multer.File, subPath: string): Promise<string> {
    const dest = path.join(this.uploadRoot, subPath);
    await fsPromises.mkdir(path.dirname(dest), { recursive: true });
    await fsPromises.writeFile(dest, file.buffer);
    return this.getUrl(subPath);
  }

  async delete(fileUrl: string): Promise<void> {
    const subPath = fileUrl.replace(/^\/uploads\//, '');
    const filePath = path.join(this.uploadRoot, subPath);
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }
  }

  getUrl(subPath: string): string {
    return `/uploads/${subPath}`;
  }
}
