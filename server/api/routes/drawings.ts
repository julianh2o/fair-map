import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();
const validKinds = ['freehand', 'line'];

router.get('/', async (_req: Request, res: Response) => {
	try {
		res.json(await prisma.drawing.findMany({ orderBy: { createdAt: 'asc' } }));
	} catch (error) {
		console.error('Error fetching drawings:', error);
		res.status(500).json({ error: 'Failed to fetch drawings' });
	}
});

router.post('/', async (req: Request, res: Response) => {
	try {
		const { layerId, kind, coords } = req.body;
		if (
			typeof layerId !== 'string' ||
			!validKinds.includes(kind) ||
			!Array.isArray(coords) ||
			coords.length < 2 ||
			!coords.every((point: unknown) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))
		) {
			res.status(400).json({ error: 'Valid layerId, kind, and at least two coordinate pairs are required' });
			return;
		}
		if (!(await prisma.layer.findUnique({ where: { id: layerId }, select: { id: true } }))) {
			res.status(400).json({ error: 'Layer does not exist' });
			return;
		}
		const drawing = await prisma.drawing.create({ data: { layerId, kind, coords: JSON.stringify(coords) } });
		res.status(201).json(drawing);
	} catch (error) {
		console.error('Error creating drawing:', error);
		res.status(500).json({ error: 'Failed to create drawing' });
	}
});

router.delete('/:id', async (req: Request, res: Response) => {
	try {
		await prisma.drawing.delete({ where: { id: req.params.id } });
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting drawing:', error);
		res.status(404).json({ error: 'Drawing not found' });
	}
});

export default router;
