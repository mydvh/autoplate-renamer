import { Router } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/database.js';
import { User, UserRole } from '../entities/User.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Get all users (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await userRepository.find({
      select: ['id', 'username', 'email', 'phoneNumber', 'role', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, phoneNumber, password, role } = req.body;

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password || '123456', 10);

    const user = userRepository.create({
      username,
      email,
      phoneNumber,
      passwordHash,
      role: role || UserRole.USER
    });

    await userRepository.save(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    await userRepository.update(id, updates);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === UserRole.ADMIN) {
      const adminCount = await userRepository.count({ where: { role: UserRole.ADMIN } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    await userRepository.delete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await userRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'username', 'email', 'phoneNumber', 'role', 'createdAt', 'inputFolderPath', 'outputFolderPath']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { username, phoneNumber, inputFolderPath, outputFolderPath } = req.body;

    const updates: any = {};
    if (username !== undefined) updates.username = username;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
    if (inputFolderPath !== undefined) updates.inputFolderPath = inputFolderPath;
    if (outputFolderPath !== undefined) updates.outputFolderPath = outputFolderPath;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    await userRepository.update(userId, updates);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
