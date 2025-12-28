// In dev mode, use the same host on port 2999
// In production, use relative path /api (same origin)
const isDev = process.env.NODE_ENV === 'development';
export const API_BASE = isDev ? `${window.location.protocol}//${window.location.hostname}:2999/api` : '/api';

export interface Layer {
	id: string;
	name: string;
	color: string;
	visible: boolean;
	createdAt: string;
	updatedAt: string;
	_count?: { markers: number };
}

export interface Marker {
	id: string;
	name: string;
	description: string | null;
	photo: string | null;
	latitude: number;
	longitude: number;
	labels: string;
	layerId: string;
	layer?: Layer;
	createdAt: string;
	updatedAt: string;
}

export const layersApi = {
	getAll: async (): Promise<Layer[]> => {
		const response = await fetch(`${API_BASE}/layers`);
		if (!response.ok) throw new Error('Failed to fetch layers');
		return response.json();
	},

	create: async (data: { name: string; color?: string }): Promise<Layer> => {
		const response = await fetch(`${API_BASE}/layers`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error('Failed to create layer');
		return response.json();
	},

	update: async (id: string, data: Partial<Layer>): Promise<Layer> => {
		const response = await fetch(`${API_BASE}/layers/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error('Failed to update layer');
		return response.json();
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`${API_BASE}/layers/${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) throw new Error('Failed to delete layer');
	},
};

export const markersApi = {
	getAll: async (layerId?: string): Promise<Marker[]> => {
		const url = layerId ? `${API_BASE}/markers?layerId=${layerId}` : `${API_BASE}/markers`;
		const response = await fetch(url);
		if (!response.ok) throw new Error('Failed to fetch markers');
		return response.json();
	},

	getLabels: async (): Promise<string[]> => {
		const response = await fetch(`${API_BASE}/markers/labels`);
		if (!response.ok) throw new Error('Failed to fetch labels');
		return response.json();
	},

	create: async (data: {
		name: string;
		description?: string;
		photo?: string;
		latitude: number;
		longitude: number;
		layerId: string;
		labels?: string[];
	}): Promise<Marker> => {
		const response = await fetch(`${API_BASE}/markers`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error('Failed to create marker');
		return response.json();
	},

	update: async (
		id: string,
		data: Partial<Omit<Marker, 'labels'>> & { labels?: string[] | string },
	): Promise<Marker> => {
		const response = await fetch(`${API_BASE}/markers/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error('Failed to update marker');
		return response.json();
	},

	delete: async (id: string): Promise<void> => {
		const response = await fetch(`${API_BASE}/markers/${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) throw new Error('Failed to delete marker');
	},
};
