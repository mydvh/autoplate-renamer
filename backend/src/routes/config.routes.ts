import { Router } from 'express';
import { AppDataSource } from '../config/database.js';
import { SystemConfig } from '../entities/SystemConfig.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const configRepository = AppDataSource.getRepository(SystemConfig);

// Get config
router.get('/', authMiddleware, async (req, res) => {
  try {
    const configs = await configRepository.find();
    
    const configObj: any = {};
    configs.forEach(c => {
      configObj[c.key] = c.value;
    });

    res.json({
      pricePerRequest: parseInt(configObj.pricePerRequest || '1000')
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update config (Admin only)
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { pricePerRequest } = req.body;

    let config = await configRepository.findOne({ where: { key: 'pricePerRequest' } });
    
    if (!config) {
      config = configRepository.create({
        key: 'pricePerRequest',
        value: String(pricePerRequest)
      });
    } else {
      config.value = String(pricePerRequest);
    }

    await configRepository.save(config);
    res.json({ message: 'Config updated successfully' });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
