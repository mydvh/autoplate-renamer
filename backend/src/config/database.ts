import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User.js';
import { ProcessingLog } from '../entities/ProcessingLog.js';
import { SystemConfig } from '../entities/SystemConfig.js';

dotenv.config();

export const AppDataSource = new DataSource({
  type: (process.env.DB_TYPE as any) || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'autoplate_renamer',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, ProcessingLog, SystemConfig],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
