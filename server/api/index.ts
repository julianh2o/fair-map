import { Router } from 'express';
import layersRouter from './routes/layers';
import markersRouter from './routes/markers';
import uploadRouter from './routes/upload';
import drawingsRouter from './routes/drawings';

const router = Router();

router.use('/layers', layersRouter);
router.use('/markers', markersRouter);
router.use('/upload', uploadRouter);
router.use('/drawings', drawingsRouter);

export default router;
