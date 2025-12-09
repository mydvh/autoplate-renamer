import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { AppDataSource } from './config/database.js';
import { User, UserRole } from './entities/User.js';
import { SystemConfig } from './entities/SystemConfig.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import logRoutes from './routes/log.routes.js';
import configRoutes from './routes/config.routes.js';
import analysisRoutes from './routes/analysis.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/config', configRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed initial data
const seedDatabase = async () => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const configRepository = AppDataSource.getRepository(SystemConfig);

    // Check if admin user already exists
    const adminExists = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const admin = userRepository.create({
        username: 'Administrator',
        email: 'admin@example.com',
        phoneNumber: '0000000000',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(admin);
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if system config exists
    const priceConfig = await configRepository.findOne({ where: { key: 'pricePerRequest' } });
    
    if (!priceConfig) {
      const config = configRepository.create({
        key: 'pricePerRequest',
        value: '1000',
      });
      await configRepository.save(config);
      console.log('✅ System config created');
    } else {
      console.log('ℹ️ System config already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Initialize Database and Start Server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    
    // Run migrations
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    // Seed initial data
    await seedDatabase();
    console.log('✅ Database seeding completed');

    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();
