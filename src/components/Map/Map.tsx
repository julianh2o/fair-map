import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import ImageStatic from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import CircleGeom from 'ol/geom/Circle';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import 'ol/ol.css';
import './Map.css';

export interface ImageOverlay {
	id: string;
	name: string;
	url: string;
	visible: boolean;
	opacity: number;
	extent: [number, number, number, number];
	rotation?: number;
}

export interface OverlayConfig {
	visible: boolean;
	opacity: number;
	extent: [number, number, number, number];
	rotation?: number;
}

export interface MapMarker {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	photo?: string;
	layer?: {
		color: string;
		visible: boolean;
	};
}

export interface UserLocation {
	latitude: number;
	longitude: number;
	accuracy?: number;
}

interface MapComponentProps {
	center?: [number, number];
	zoom?: number;
	satelliteVisible?: boolean;
	overlayConfig?: OverlayConfig;
	imageOverlays?: ImageOverlay[];
	markers?: MapMarker[];
	userLocation?: UserLocation | null;
	showUserLocation?: boolean;
	onLongPress?: (longitude: number, latitude: number) => void;
}

export const MapComponent = ({
	center = [0, 0],
	zoom = 2,
	satelliteVisible = true,
	overlayConfig,
	imageOverlays = [],
	markers = [],
	userLocation,
	showUserLocation = false,
	onLongPress,
}: MapComponentProps) => {
	// eslint-disable-next-line no-undef
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<Map | null>(null);
	const streetLayerRef = useRef<TileLayer<OSM> | null>(null);
	const satelliteLayerRef = useRef<TileLayer<XYZ> | null>(null);
	// eslint-disable-next-line no-undef
	const imageOverlayLayersRef = useRef(new globalThis.Map<string, ImageLayer<ImageStatic>>());
	const markersLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const userLocationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressPositionRef = useRef<number[] | null>(null);

	useEffect(() => {
		if (!mapRef.current) return;

		// Create street base layer (always visible)
		const streetLayer = new TileLayer({
			source: new OSM(),
		});
		streetLayerRef.current = streetLayer;

		// Create satellite layer (toggleable)
		const satelliteLayer = new TileLayer({
			source: new XYZ({
				url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
				maxZoom: 19,
			}),
			visible: satelliteVisible,
		});
		satelliteLayerRef.current = satelliteLayer;

		const layers: Array<TileLayer<OSM | XYZ> | ImageLayer<ImageStatic> | VectorLayer<VectorSource>> = [
			streetLayer,
			satelliteLayer,
		];

		// Add image overlays
		imageOverlayLayersRef.current.clear();
		imageOverlays.forEach((overlay) => {
			const imageLayer = new ImageLayer({
				source: new ImageStatic({
					url: overlay.url,
					imageExtent: overlay.extent,
				}),
				opacity: overlay.opacity,
				visible: overlay.visible,
			});
			imageOverlayLayersRef.current.set(overlay.id, imageLayer);
			layers.push(imageLayer);
		});

		const markersSource = new VectorSource();
		const markersLayer = new VectorLayer({
			source: markersSource,
			style: (feature) => {
				const color = feature.get('color') || '#FF5733';
				const name = feature.get('name') || '';
				const hasPhoto = feature.get('hasPhoto') || false;

				// Show camera icon if marker has photo but no name
				const displayText = !name && hasPhoto ? '📷' : name;

				return new Style({
					image: new Circle({
						radius: 8,
						fill: new Fill({ color: color }),
						stroke: new Stroke({ color: '#fff', width: 2 }),
					}),
					text: new Text({
						text: displayText,
						offsetY: -15,
						fill: new Fill({ color: '#fff' }),
						stroke: new Stroke({ color: '#000', width: 3 }),
						font: 'bold 12px sans-serif',
					}),
				});
			},
		});

		// Immediately populate with current markers
		const features = markers
			.filter((marker) => marker.layer?.visible !== false)
			.map((marker) => {
				const feature = new Feature({
					geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
				});
				feature.setId(marker.id);
				feature.set('name', marker.name);
				feature.set('color', marker.layer?.color || '#FF5733');
				feature.set('hasPhoto', !!marker.photo);
				return feature;
			});
		markersSource.addFeatures(features);

		markersLayerRef.current = markersLayer;
		layers.push(markersLayer);

		// Create user location layer
		const userLocationSource = new VectorSource();
		const userLocationLayer = new VectorLayer({
			source: userLocationSource,
			style: (feature) => {
				const featureType = feature.get('type');
				if (featureType === 'accuracy') {
					return new Style({
						stroke: new Stroke({ color: '#4285F4', width: 1 }),
						fill: new Fill({ color: 'rgba(66, 133, 244, 0.2)' }),
					});
				}
				// Position dot
				return new Style({
					image: new Circle({
						radius: 10,
						fill: new Fill({ color: '#4285F4' }),
						stroke: new Stroke({ color: '#fff', width: 3 }),
					}),
				});
			},
		});

		userLocationLayerRef.current = userLocationLayer;
		layers.push(userLocationLayer);

		const view = new View({
			center: fromLonLat(center),
			zoom: zoom,
		});

		const map = new Map({
			target: mapRef.current,
			layers: layers,
			view: view,
			controls: [],
		});

		mapInstanceRef.current = map;

		const handleZoomChange = () => {
			const currentZoom = view.getZoom();
			console.log('Current zoom level:', currentZoom?.toFixed(2));
		};

		view.on('change:resolution', handleZoomChange);
		console.log('Initial zoom level:', zoom);

		let cleanupPointerHandlers: (() => void) | null = null;

		if (onLongPress) {
			const viewport = map.getViewport();
			const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

			// Double-click handler for desktop
			const handleDblClick = (evt: Event) => {
				const mouseEvt = evt as MouseEvent;
				if (!isTouchDevice) {
					mouseEvt.preventDefault();
					const pixel = map.getEventPixel(mouseEvt);
					const coordinate = map.getCoordinateFromPixel(pixel);
					if (coordinate) {
						const [lon, lat] = toLonLat(coordinate);
						onLongPress(lon, lat);
					}
				}
			};

			// Long-press handlers for touch devices
			const handlePointerDown = (evt: Event) => {
				// eslint-disable-next-line no-undef
				const pointerEvt = evt as globalThis.PointerEvent;
				if (isTouchDevice && pointerEvt.pointerType === 'touch') {
					const pixel = map.getEventPixel(pointerEvt);
					const coordinate = map.getCoordinateFromPixel(pixel);
					if (coordinate) {
						longPressPositionRef.current = coordinate;
						longPressTimerRef.current = setTimeout(() => {
							if (longPressPositionRef.current) {
								const [lon, lat] = toLonLat(longPressPositionRef.current);
								onLongPress(lon, lat);
								longPressPositionRef.current = null;
							}
						}, 500);
					}
				}
			};

			const handlePointerMove = (evt: Event) => {
				// eslint-disable-next-line no-undef
				const pointerEvt = evt as globalThis.PointerEvent;
				if (isTouchDevice && pointerEvt.pointerType === 'touch' && longPressTimerRef.current) {
					clearTimeout(longPressTimerRef.current);
					longPressTimerRef.current = null;
					longPressPositionRef.current = null;
				}
			};

			const handlePointerUp = (evt: Event) => {
				// eslint-disable-next-line no-undef
				const pointerEvt = evt as globalThis.PointerEvent;
				if (isTouchDevice && pointerEvt.pointerType === 'touch' && longPressTimerRef.current) {
					clearTimeout(longPressTimerRef.current);
					longPressTimerRef.current = null;
					longPressPositionRef.current = null;
				}
			};

			viewport.addEventListener('dblclick', handleDblClick);
			viewport.addEventListener('pointerdown', handlePointerDown);
			viewport.addEventListener('pointermove', handlePointerMove);
			viewport.addEventListener('pointerup', handlePointerUp);

			cleanupPointerHandlers = () => {
				viewport.removeEventListener('dblclick', handleDblClick);
				viewport.removeEventListener('pointerdown', handlePointerDown);
				viewport.removeEventListener('pointermove', handlePointerMove);
				viewport.removeEventListener('pointerup', handlePointerUp);
			};
		}

		return () => {
			view.un('change:resolution', handleZoomChange);
			if (cleanupPointerHandlers) {
				cleanupPointerHandlers();
			}
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
			}
			map.setTarget(undefined);
		};
	}, [center, zoom, onLongPress]);

	// Handle satellite visibility changes
	useEffect(() => {
		if (satelliteLayerRef.current) {
			satelliteLayerRef.current.setVisible(satelliteVisible);
		}
	}, [satelliteVisible]);

	useEffect(() => {
		imageOverlays.forEach((overlay) => {
			const layer = imageOverlayLayersRef.current.get(overlay.id);
			if (layer) {
				layer.setOpacity(overlay.opacity);
				layer.setVisible(overlay.visible);
			}
		});
	}, [imageOverlays]);

	useEffect(() => {
		if (!markersLayerRef.current) return;

		const source = markersLayerRef.current.getSource();
		if (!source) return;

		source.clear();

		const features = markers
			.filter((marker) => marker.layer?.visible !== false)
			.map((marker) => {
				const feature = new Feature({
					geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
				});
				feature.setId(marker.id);
				feature.set('name', marker.name);
				feature.set('color', marker.layer?.color || '#FF5733');
				feature.set('hasPhoto', !!marker.photo);
				return feature;
			});

		source.addFeatures(features);
	}, [markers]);

	useEffect(() => {
		if (!userLocationLayerRef.current) return;

		const source = userLocationLayerRef.current.getSource();
		if (!source) return;

		source.clear();

		if (showUserLocation && userLocation) {
			const features: Feature[] = [];

			// Add accuracy circle if accuracy is available
			if (userLocation.accuracy && userLocation.accuracy > 0) {
				const accuracyFeature = new Feature({
					geometry: new CircleGeom(fromLonLat([userLocation.longitude, userLocation.latitude]), userLocation.accuracy),
				});
				accuracyFeature.set('type', 'accuracy');
				features.push(accuracyFeature);
			}

			// Add position dot
			const positionFeature = new Feature({
				geometry: new Point(fromLonLat([userLocation.longitude, userLocation.latitude])),
			});
			positionFeature.set('type', 'position');
			features.push(positionFeature);

			source.addFeatures(features);
		}
	}, [userLocation, showUserLocation]);

	useEffect(() => {
		if (!overlayConfig || !mapInstanceRef.current) return;

		imageOverlays.forEach((overlay) => {
			const layer = imageOverlayLayersRef.current.get(overlay.id);
			if (layer) {
				const newExtent = overlayConfig.extent;
				const newSource = new ImageStatic({
					url: overlay.url,
					imageExtent: newExtent,
				});
				layer.setSource(newSource);

				if (overlayConfig.rotation !== undefined) {
					mapInstanceRef.current?.once('rendercomplete', () => {
						const renderer = layer.getRenderer() as any;
						if (renderer && renderer.canvas) {
							renderer.canvas.style.transform = `rotate(${overlayConfig.rotation}deg)`;
							renderer.canvas.style.transformOrigin = 'center';
						}
					});
				}
			}
		});

		mapInstanceRef.current.render();
	}, [overlayConfig, imageOverlays]);

	return <div ref={mapRef} className='map-container' />;
};
