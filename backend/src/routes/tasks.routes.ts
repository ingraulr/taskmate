import { Router } from 'express';
import { authMiddleware } from
  '../middleware/auth.middleware';
import * as tc from '../controllers/tasks.controller';

const router = Router();
router.use(authMiddleware);
router.get('/',       tc.getTasks);
router.post('/',      tc.createTask);
router.put('/:id',    tc.updateTask);
router.delete('/:id', tc.deleteTask);
export default router;