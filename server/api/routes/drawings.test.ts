import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db', () => ({
	prisma: {
		drawing: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
		layer: { findUnique: vi.fn() },
	},
}));

import { prisma } from '../../db';
import drawingsRouter from './drawings';

const app = express();
app.use(express.json());
app.use('/drawings', drawingsRouter);

describe('drawings API', () => {
	beforeEach(() => vi.clearAllMocks());

	it('lists persisted drawings', async () => {
		vi.mocked(prisma.drawing.findMany).mockResolvedValue([{ id: 'd1' } as never]);
		const response = await request(app).get('/drawings');
		expect(response.status).toBe(200);
		expect(response.body).toEqual([{ id: 'd1' }]);
	});

	it('rejects invalid kind or too few points', async () => {
		const response = await request(app)
			.post('/drawings')
			.send({ layerId: 'l1', kind: 'circle', coords: [[1, 2]] });
		expect(response.status).toBe(400);
		expect(prisma.drawing.create).not.toHaveBeenCalled();
	});

	it('requires an existing layer and creates a drawing', async () => {
		vi.mocked(prisma.layer.findUnique).mockResolvedValue({ id: 'l1' } as never);
		vi.mocked(prisma.drawing.create).mockResolvedValue({
			id: 'd1',
			layerId: 'l1',
			kind: 'line',
			coords: '[[1,2],[3,4]]',
		} as never);
		const response = await request(app)
			.post('/drawings')
			.send({
				layerId: 'l1',
				kind: 'line',
				coords: [
					[1, 2],
					[3, 4],
				],
			});
		expect(response.status).toBe(201);
		expect(prisma.drawing.create).toHaveBeenCalledWith({
			data: { layerId: 'l1', kind: 'line', coords: '[[1,2],[3,4]]' },
		});
	});

	it('deletes a drawing', async () => {
		const response = await request(app).delete('/drawings/d1');
		expect(response.status).toBe(204);
		expect(prisma.drawing.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
	});
});
