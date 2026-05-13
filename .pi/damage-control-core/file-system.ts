import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class FileIO {
  static exists(dir: string): boolean {
    return fs.existsSync(path.join(this.getBasePath(), dir));
  }

  static readFile(dir: string): Promise<string> {
    const filePath = path.join(this.getBasePath(), dir);
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  static writeFile(dir: string | number | Buffer, data: string): void {
    const filePath = path.join(this.getBasePath(), dir);
    fs.writeFileSync(filePath, data);
  }

  static deleteFile(dir: string): void {
    try {
      fs.unlinkSync(path.join(this.getBasePath(), dir));
    } catch (err) {
      // File might not exist, which is fine
    }
  }

  static async readFileAsync(dir: string): Promise<string> {
    return await this.readFile(dir);
  }

  static createDirectory(dir: string): void {
    fs.mkdirSync(path.join(this.getBasePath(), dir), { recursive: true });
  }

  getBasePath(): string {
    return process.cwd();
  }

  static hash(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  static getBaseDirectory(): string {
    // Return the base directory for file operations
    return this.getBasePath();
  }
}