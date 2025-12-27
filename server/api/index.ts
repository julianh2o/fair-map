import { Router } from 'express';
import layersRouter from './routes/layers';
import markersRouter from './routes/markers';

const router = Router();

router.use('/layers', layersRouter);
router.use('/markers', markersRouter);

export default router;
