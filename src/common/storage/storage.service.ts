/// <reference types="multer" />
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class StorageService {
  abstract save(file: Express.Multer.File, subPath: string): Promise<string>;
  abstract delete(fileUrl: string): Promise<void>;
  abstract getUrl(subPath: string): string;
}
