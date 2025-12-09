import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;
}
