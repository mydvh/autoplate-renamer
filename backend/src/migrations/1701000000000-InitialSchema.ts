import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcrypt';

export class InitialSchema1701000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await queryRunner.query(`
      INSERT INTO users (id, username, email, "phoneNumber", "passwordHash", role, "createdAt")
      VALUES (
        gen_random_uuid(),
        'Administrator',
        'admin@example.com',
        '0000000000',
        '${hashedPassword}',
        'ADMIN',
        NOW()
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    // Create default system config
    await queryRunner.query(`
      INSERT INTO system_config (key, value)
      VALUES ('pricePerRequest', '1000')
      ON CONFLICT (key) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE email = 'admin@example.com'`);
    await queryRunner.query(`DELETE FROM system_config WHERE key = 'pricePerRequest'`);
  }
}
