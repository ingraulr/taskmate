import { Router } from 'express';
import { register, login, getMe, changePassword, changeEmail, updateAvatar, deleteAccount } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/password', authMiddleware, changePassword);
router.put('/email', authMiddleware, changeEmail);
router.put('/avatar', authMiddleware, updateAvatar);
router.delete('/account', authMiddleware, deleteAccount);

export default router;