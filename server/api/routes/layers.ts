import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
	try {
		const layers = await prisma.layer.findMany({
			include: {
				_count: {
					select: { markers: true },
				},
			},
			orderBy: { createdAt: 'asc' },
		});
		res.json(layers);
	} catch (error) {
		console.error('Error fetching layers:', error);
		res.status(500).json({ error: 'Failed to fetch layers' });
	}
});

router.post('/', async (req: Request, res: Response) => {
	try {
		const { name, color } = req.body;
		if (!name) {
			res.status(400).json({ error: 'Name is required' });
			return;
		}
		const layer = await prisma.layer.create({
			data: { name, color: color || '#FF5733' },
		});
		res.status(201).json(layer);
	} catch (error) {
		console.error('Error creating layer:', error);
		res.status(500).json({ error: 'Failed to create layer' });
	}
});

router.put('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, color, visible } = req.body;
		const layer = await prisma.layer.update({
			where: { id },
			data: { name, color, visible },
		});
		res.json(layer);
	} catch (error) {
		console.error('Error updating layer:', error);
		res.status(500).json({ error: 'Failed to update layer' });
	}
});

router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await prisma.layer.delete({ where: { id } });
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting layer:', error);
		res.status(500).json({ error: 'Failed to delete layer' });
	}
});

export default router;
