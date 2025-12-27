export interface GeocodingResult {
	lat: number;
	lon: number;
	display_name: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?` +
				new URLSearchParams({
					q: address,
					format: 'json',
					limit: '1',
				}),
			{
				headers: {
					'User-Agent': 'FairMapApp/1.0',
				},
			},
		);

		if (!response.ok) {
			console.error('Geocoding request failed:', response.statusText);
			return null;
		}

		const data = await response.json();

		if (data && data.length > 0) {
			const result = data[0];
			return {
				lat: parseFloat(result.lat),
				lon: parseFloat(result.lon),
				display_name: result.display_name,
			};
		}

		return null;
	} catch (error) {
		console.error('Error geocoding address:', error);
		return null;
	}
};
