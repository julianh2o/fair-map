import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import './Map.css';

interface MapComponentProps {
	center?: [number, number];
	zoom?: number;
}

export const MapComponent = ({ center = [0, 0], zoom = 2 }: MapComponentProps) => {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<Map | null>(null);

	useEffect(() => {
		if (!mapRef.current) return;

		const map = new Map({
			target: mapRef.current,
			layers: [
				new TileLayer({
					source: new OSM(),
				}),
			],
			view: new View({
				center: fromLonLat(center),
				zoom: zoom,
			}),
			controls: [],
		});

		mapInstanceRef.current = map;

		return () => {
			map.setTarget(undefined);
		};
	}, [center, zoom]);

	return <div ref={mapRef} className="map-container" />;
};
