import { Router } from 'express';
import { AppDataSource } from '../config/database.js';
import { ProcessingLog } from '../entities/ProcessingLog.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
const logRepository = AppDataSource.getRepository(ProcessingLog);

// Create log
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { originalName, newName } = req.body;
    const userId = req.user!.id;
    
    // Get username from user table or use cached value
    const username = req.body.username || req.user!.email;

    const log = logRepository.create({
      userId,
      username,
      originalName,
      newName
    });

    await logRepository.save(log);
    res.status(201).json({ message: 'Log created successfully' });
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs with filters
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to, userId } = req.query;
    
    let query = logRepository.createQueryBuilder('log');

    // Non-admin users can only see their own logs
    if (req.user!.role !== 'ADMIN') {
      query = query.where('log.userId = :userId', { userId: req.user!.id });
    } else if (userId) {
      query = query.where('log.userId = :userId', { userId });
    }

    if (from) {
      query = query.andWhere('log.timestamp >= :from', { from: new Date(Number(from)) });
    }

    if (to) {
      query = query.andWhere('log.timestamp <= :to', { to: new Date(Number(to)) });
    }

    const logs = await query.orderBy('log.timestamp', 'DESC').getMany();
    
    // Convert to frontend format
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      username: log.username,
      originalName: log.originalName,
      newName: log.newName,
      timestamp: log.timestamp.getTime()
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
