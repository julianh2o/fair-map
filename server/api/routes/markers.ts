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

router.get('/labels', async (req: Request, res: Response) => {
	try {
		const markers = await prisma.marker.findMany({
			select: { labels: true },
		});

		// Extract all unique labels
		const labelsSet = new Set<string>();
		markers.forEach((marker) => {
			try {
				const labels = JSON.parse(marker.labels || '[]') as string[];
				labels.forEach((label) => labelsSet.add(label));
			} catch (e) {
				console.error('Error parsing labels:', e);
			}
		});

		res.json(Array.from(labelsSet).sort());
	} catch (error) {
		console.error('Error fetching labels:', error);
		res.status(500).json({ error: 'Failed to fetch labels' });
	}
});

router.post('/', async (req: Request, res: Response) => {
	try {
		const { name, description, photo, latitude, longitude, layerId, labels } = req.body;
		// Name is required unless photo is provided
		if ((!name && !photo) || latitude === undefined || longitude === undefined || !layerId) {
			res.status(400).json({ error: 'Name or photo, latitude, longitude, and layerId are required' });
			return;
		}
		const marker = await prisma.marker.create({
			data: {
				name: name || '',
				description,
				photo,
				latitude,
				longitude,
				layerId,
				labels: labels ? JSON.stringify(labels) : '[]',
			},
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
		const { name, description, photo, latitude, longitude, labels } = req.body;
		const updateData: any = { name, description, photo, latitude, longitude };

		// Only update labels if provided
		if (labels !== undefined) {
			updateData.labels = JSON.stringify(labels);
		}

		const marker = await prisma.marker.update({
			where: { id },
			data: updateData,
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
