declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';
  import { v2 as cloudinary } from 'cloudinary';

  interface CloudinaryStorageOptions {
    cloudinary: typeof cloudinary;
    params: {
      folder?: string;
      format?: string;
      public_id?: (req: any, file: any) => string;
      transformation?: any[];
      allowed_formats?: string[];
      resource_type?: string;
    };
  }

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(req: any, file: any, cb: (error?: any, info?: any) => void): void;
    _removeFile(req: any, file: any, cb: (error?: any) => void): void;
  }

  export default CloudinaryStorage;
}