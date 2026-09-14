export interface SavedObject {
  key: string;
  sizeBytes: number;
}

/**
 * Storage abstraction. Product media never lives inside the deployed backend,
 * so redeploying can not delete it. Swapping the filesystem driver for an
 * object store (S3, Vercel Blob, ...) must not require any change to the
 * product database structure or to frontend components — only this interface
 * and MEDIA_* configuration.
 */
export interface StorageService {
  readonly driver: string;
  /** Human readable description of where objects live (logs / health only). */
  readonly location: string;
  save(key: string, data: Buffer): Promise<SavedObject>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}
