export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum PlateColor {
  WHITE = 'white',
  YELLOW = 'yellow',
  BLUE = 'blue',
  OTHER = 'other',
}

export enum Viewpoint {
  FRONT = 'front',
  REAR = 'rear',
  UNKNOWN = 'unknown',
}

export interface AnalysisResult {
  plateNumber: string;
  plateColor: PlateColor;
  viewpoint: Viewpoint;
}

// Auth & DB Types
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  password?: string; // Optional in frontend display, required in DB
  role: UserRole;
  createdAt: number | Date;
  inputFolderPath?: string | null;
  outputFolderPath?: string | null;
}

export interface ProcessingLog {
  id: string;
  userId: string;
  username: string; // Denormalized for easier display
  originalName: string;
  newName: string;
  timestamp: number;
}

export interface SystemConfig {
  pricePerRequest: number;
}

// File System Access API Types (minimal definition)
export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  values(): AsyncIterableIterator<FileSystemHandle | FileSystemDirectoryHandle | FileSystemFileHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string): Promise<void>;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  close(): Promise<void>;
}

export interface FileItem {
  id: string;
  originalFile: File;
  fileHandle?: FileSystemFileHandle; // Handle to the original file for deletion
  previewUrl: string;
  status: ProcessingStatus;
  result?: AnalysisResult;
  newName?: string;
  errorMessage?: string;
}