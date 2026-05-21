import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingService {
  abstract hash(data: string | Buffer): Promise<string>; // takes data as input and returns hashed string
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>; // takes data to be encrypted and the encrypted string (the data to be compared against)
}
