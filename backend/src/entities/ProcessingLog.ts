import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.js';

@Entity('processing_logs')
export class ProcessingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 255 })
  newName: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => User, user => user.logs)
  @JoinColumn({ name: 'userId' })
  user: User;
}
