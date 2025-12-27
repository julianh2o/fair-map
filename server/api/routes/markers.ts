import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
	try {
		const { layerId } = req.query;
		const markers = await prisma.marker.findMany({
			where: layerId ? { layerId: layerId as string } : undefined,
			include: { layer: true },
			orderBy: { createdAt: 'desc' },
		});
		res.json(markers);
	} catch (error) {
		console.error('Error fetching markers:', error);
		res.status(500).json({ error: 'Failed to fetch markers' });
	}
});

router.post('/', async (req: Request, res: Response) => {
	try {
		const { name, description, photo, latitude, longitude, layerId } = req.body;
		// Name is required unless photo is provided
		if ((!name && !photo) || latitude === undefined || longitude === undefined || !layerId) {
			res.status(400).json({ error: 'Name or photo, latitude, longitude, and layerId are required' });
			return;
		}
		const marker = await prisma.marker.create({
			data: { name: name || '', description, photo, latitude, longitude, layerId },
			include: { layer: true },
		});
		res.status(201).json(marker);
	} catch (error) {
		console.error('Error creating marker:', error);
		res.status(500).json({ error: 'Failed to create marker' });
	}
});

router.put('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { name, description, photo, latitude, longitude } = req.body;
		const marker = await prisma.marker.update({
			where: { id },
			data: { name, description, photo, latitude, longitude },
			include: { layer: true },
		});
		res.json(marker);
	} catch (error) {
		console.error('Error updating marker:', error);
		res.status(500).json({ error: 'Failed to update marker' });
	}
});

router.delete('/:id', async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		await prisma.marker.delete({ where: { id } });
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting marker:', error);
		res.status(500).json({ error: 'Failed to delete marker' });
	}
});

export default router;
