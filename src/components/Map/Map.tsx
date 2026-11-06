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
import LineString from 'ol/geom/LineString';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import Modify from 'ol/interaction/Modify';
import Draw from 'ol/interaction/Draw';
import { defaults } from 'ol/interaction/defaults';
import { ModifyEvent } from 'ol/interaction/Modify';
import { Collection } from 'ol';
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
	labels?: string;
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

export interface MapDrawing { id: string; layerId: string; kind: 'freehand' | 'line'; coords: string; color?: string; visible?: boolean; }

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
	crosshairsTarget?: { latitude: number; longitude: number } | null;
	onMarkerClick?: (markerId: string) => void;
	selectedMarkerId?: string | null;
	highlightedLabel?: string | null;
	onMarkerDrag?: (markerId: string, longitude: number, latitude: number) => void;
	drawings?: MapDrawing[];
	drawMode?: boolean;
	drawTool?: 'freehand' | 'line' | 'eraser';
	activeLayerId?: string;
	activeLayerColor?: string;
	onDrawingCreated?: (kind: 'freehand' | 'line', coords: number[][]) => void;
	onDrawingErase?: (id: string) => void;
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
	crosshairsTarget,
	onMarkerClick,
	selectedMarkerId = null,
	highlightedLabel = null,
	onMarkerDrag,
	drawings = [], drawMode = false, drawTool = 'freehand', activeLayerId = '', activeLayerColor = '#FF5733', onDrawingCreated, onDrawingErase,
}: MapComponentProps) => {
	// eslint-disable-next-line no-undef
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<Map | null>(null);
	const streetLayerRef = useRef<TileLayer<OSM> | null>(null);
	const satelliteLayerRef = useRef<TileLayer<XYZ> | null>(null);
	// eslint-disable-next-line no-undef
	const imageOverlayLayersRef = useRef(new globalThis.Map<string, ImageLayer<ImageStatic>>());
	const markersLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const drawingsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const drawInteractionRef = useRef<Draw | null>(null);
	const erasedDuringGestureRef = useRef(new Set<string>());
	const drawingPropsRef = useRef({ drawMode, drawTool, activeLayerId, activeLayerColor, onDrawingCreated, onDrawingErase });
	const userLocationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const crosshairsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const labelConnectionsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressPositionRef = useRef<number[] | null>(null);
	const crosshairsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onMarkerClickRef = useRef(onMarkerClick);
	const onLongPressRef = useRef(onLongPress);
	const highlightedLabelRef = useRef(highlightedLabel);
	const onMarkerDragRef = useRef(onMarkerDrag);
	const modifyInteractionRef = useRef<Modify | null>(null);
	const selectedMarkerIdRef = useRef(selectedMarkerId);
	useEffect(() => { drawingPropsRef.current = { drawMode, drawTool, activeLayerId, activeLayerColor, onDrawingCreated, onDrawingErase }; }, [drawMode, drawTool, activeLayerId, activeLayerColor, onDrawingCreated, onDrawingErase]);
	const highlightedLabelColor = '#ff00fbff';

	// Update callback refs when they change (without reinitializing the map)
	useEffect(() => {
		onMarkerClickRef.current = onMarkerClick;
		onLongPressRef.current = onLongPress;
		onMarkerDragRef.current = onMarkerDrag;
		selectedMarkerIdRef.current = selectedMarkerId;
	}, [onMarkerClick, onLongPress, onMarkerDrag, selectedMarkerId]);

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
				const isSelected = feature.getId() === selectedMarkerIdRef.current;
				const labels = feature.get('labels') || '[]';

				// Check if this marker has the highlighted label
				let hasHighlightedLabel = false;
				if (highlightedLabelRef.current) {
					try {
						const markerLabels = JSON.parse(labels);
						hasHighlightedLabel = Array.isArray(markerLabels) && markerLabels.includes(highlightedLabelRef.current);
					} catch (e) {
						// Invalid JSON, ignore
					}
				}

				return new Style({
					image: new Circle({
						radius: hasHighlightedLabel ? 10 : 8,
						fill: new Fill({ color: color }),
						stroke: new Stroke({
							color: isSelected ? '#00BFFF' : hasHighlightedLabel ? highlightedLabelColor : '#fff',
							width: isSelected ? 4 : hasHighlightedLabel ? 3 : 2,
						}),
					}),
					text: new Text({
						text: name,
						offsetY: -15,
						fill: new Fill({ color: '#fff' }),
						stroke: new Stroke({ color: '#000', width: 3 }),
						font: 'bold 12px sans-serif',
					}),
				});
			},
		});
		markersLayer.setZIndex(10);

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
				feature.set('labels', marker.labels || '[]');
				feature.set('latitude', marker.latitude);
				feature.set('longitude', marker.longitude);
				return feature;
			});
		markersSource.addFeatures(features);

		markersLayerRef.current = markersLayer;
		layers.push(markersLayer);

		const drawingsSource = new VectorSource();
		const drawingsLayer = new VectorLayer({ source: drawingsSource, style: (feature) => new Style({ stroke: new Stroke({ color: feature.get('color') || '#FF5733', width: 2 }) }), zIndex: 5 });
		drawingsLayerRef.current = drawingsLayer;
		layers.push(drawingsLayer);

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

		// Create crosshairs layer
		const crosshairsSource = new VectorSource();
		const crosshairsLayer = new VectorLayer({
			source: crosshairsSource,
			style: new Style({
				stroke: new Stroke({
					color: '#FF0000',
					width: 2,
				}),
			}),
		});

		crosshairsLayerRef.current = crosshairsLayer;
		layers.push(crosshairsLayer);

		// Create label connections layer (for drawing lines between markers with the same label)
		const labelConnectionsSource = new VectorSource();
		const labelConnectionsLayer = new VectorLayer({
			source: labelConnectionsSource,
			style: new Style({
				stroke: new Stroke({
					color: highlightedLabelColor,
					width: 2,
					lineDash: [5, 5], // Dashed line
				}),
			}),
			zIndex: 10, // Above markers
		});

		labelConnectionsLayerRef.current = labelConnectionsLayer;
		layers.push(labelConnectionsLayer);

		const view = new View({
			center: fromLonLat(center),
			zoom: zoom,
		});

		const map = new Map({
			target: mapRef.current,
			layers: layers,
			view: view,
			controls: [],
			interactions: defaults({ doubleClickZoom: false }),
		});

		mapInstanceRef.current = map;

		const handleZoomChange = () => {
			const currentZoom = view.getZoom();
			console.log('Current zoom level:', currentZoom?.toFixed(2));
		};

		view.on('change:resolution', handleZoomChange);
		console.log('Initial zoom level:', zoom);

		// Handle marker clicks
		let cleanupMarkerClickHandler: (() => void) | null = null;
		if (onMarkerClickRef.current) {
			const handleMapClick = (evt: any) => {
				if (drawingPropsRef.current.drawMode) return;
				const feature = map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => layer === markersLayer ? feature : undefined);
				if (feature && feature.getId()) {
					const markerId = feature.getId() as string;
					onMarkerClickRef.current?.(markerId);
				}
			};

			map.on('singleclick', handleMapClick);
			cleanupMarkerClickHandler = () => {
				map.un('singleclick', handleMapClick);
			};
		}

		let cleanupPointerHandlers: (() => void) | null = null;

		if (onLongPressRef.current) {
			const viewport = map.getViewport();
			let lastPointerType = '';

			// Double-click handler for desktop
			const handleDblClick = (evt: Event) => {
				const mouseEvt = evt as MouseEvent;
				if (lastPointerType !== 'touch' && !drawingPropsRef.current.drawMode) {
					mouseEvt.preventDefault();
					const pixel = map.getEventPixel(mouseEvt);
					const coordinate = map.getCoordinateFromPixel(pixel);
					if (coordinate) {
						const [lon, lat] = toLonLat(coordinate);
						onLongPressRef.current?.(lon, lat);
					}
				}
			};

			// Long-press handlers for touch devices
			const handlePointerDown = (evt: Event) => {
				// eslint-disable-next-line no-undef
				const pointerEvt = evt as globalThis.PointerEvent;
				lastPointerType = pointerEvt.pointerType;
				if (pointerEvt.pointerType === 'touch' && !drawingPropsRef.current.drawMode) {
					const pixel = map.getEventPixel(pointerEvt);
					const coordinate = map.getCoordinateFromPixel(pixel);
					if (coordinate) {
						longPressPositionRef.current = coordinate;
						longPressTimerRef.current = setTimeout(() => {
							if (longPressPositionRef.current) {
								const [lon, lat] = toLonLat(longPressPositionRef.current);
								onLongPressRef.current?.(lon, lat);
								longPressPositionRef.current = null;
							}
						}, 500);
					}
				}
			};

			const handlePointerMove = (evt: Event) => {
				// eslint-disable-next-line no-undef
				const pointerEvt = evt as globalThis.PointerEvent;
				lastPointerType = pointerEvt.pointerType;
				if (pointerEvt.pointerType === 'touch' && longPressTimerRef.current) {
					clearTimeout(longPressTimerRef.current);
					longPressTimerRef.current = null;
					longPressPositionRef.current = null;
				}
			};

			const handlePointerUp = (evt: Event) => {
				// eslint-disable-next-line no-undef
				const pointerEvt = evt as globalThis.PointerEvent;
				lastPointerType = pointerEvt.pointerType;
				if (pointerEvt.pointerType === 'touch' && longPressTimerRef.current) {
					clearTimeout(longPressTimerRef.current);
					longPressTimerRef.current = null;
					longPressPositionRef.current = null;
				}
			};

			viewport.addEventListener('dblclick', handleDblClick);
			viewport.addEventListener('pointerdown', handlePointerDown);
			viewport.addEventListener('pointermove', handlePointerMove);
			viewport.addEventListener('pointerup', handlePointerUp);
			const pointerTypeHandler = (event: Event) => { lastPointerType = (event as globalThis.PointerEvent).pointerType; };
			viewport.addEventListener('pointerdown', pointerTypeHandler, true);

			cleanupPointerHandlers = () => {
				viewport.removeEventListener('dblclick', handleDblClick);
				viewport.removeEventListener('pointerdown', handlePointerDown);
				viewport.removeEventListener('pointermove', handlePointerMove);
				viewport.removeEventListener('pointerup', handlePointerUp);
				viewport.removeEventListener('pointerdown', pointerTypeHandler, true);
			};
		}

		return () => {
			view.un('change:resolution', handleZoomChange);
			if (cleanupMarkerClickHandler) {
				cleanupMarkerClickHandler();
			}
			if (cleanupPointerHandlers) {
				cleanupPointerHandlers();
			}
			if (longPressTimerRef.current) {
				clearTimeout(longPressTimerRef.current);
			}
			map.setTarget(undefined);
		};
	}, [center, zoom]);

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
				feature.set('labels', marker.labels || '[]');
				feature.set('latitude', marker.latitude);
				feature.set('longitude', marker.longitude);
				return feature;
			});

		source.addFeatures(features);
	}, [markers]);

	// Update marker styles when selection changes
	useEffect(() => {
		if (!markersLayerRef.current) return;
		markersLayerRef.current.changed();
	}, [selectedMarkerId]);

	// Handle highlighted label changes - update ref and redraw markers and connections
	useEffect(() => {
		highlightedLabelRef.current = highlightedLabel;

		// Update marker styles
		if (markersLayerRef.current) {
			markersLayerRef.current.changed();
		}

		// Draw connections from selected marker to other markers with the same label
		if (!labelConnectionsLayerRef.current || !markersLayerRef.current) return;

		const connectionsSource = labelConnectionsLayerRef.current.getSource();
		if (!connectionsSource) return;

		connectionsSource.clear();

		if (!highlightedLabel || !selectedMarkerId) return;

		// Find all markers with the highlighted label
		const markersSource = markersLayerRef.current.getSource();
		if (!markersSource) return;

		// Get the selected marker
		const selectedFeature = markersSource.getFeatureById(selectedMarkerId);
		if (!selectedFeature) return;

		// Check if selected marker has the highlighted label
		const selectedLabels = selectedFeature.get('labels') || '[]';
		let selectedHasLabel = false;
		try {
			const markerLabels = JSON.parse(selectedLabels);
			selectedHasLabel = Array.isArray(markerLabels) && markerLabels.includes(highlightedLabel);
		} catch (e) {
			// Invalid JSON, ignore
		}

		if (!selectedHasLabel) return;

		// Get the selected marker's geometry
		const selectedGeom = selectedFeature.getGeometry();
		if (!selectedGeom || selectedGeom.getType() !== 'Point') return;
		const selectedCoords = (selectedGeom as Point).getCoordinates();

		// Draw lines from selected marker to all other markers with the highlighted label
		markersSource.forEachFeature((feature) => {
			// Skip the selected marker itself
			if (feature.getId() === selectedMarkerId) return;

			const labels = feature.get('labels') || '[]';
			try {
				const markerLabels = JSON.parse(labels);
				if (Array.isArray(markerLabels) && markerLabels.includes(highlightedLabel)) {
					const geom = feature.getGeometry();
					if (geom && geom.getType() === 'Point') {
						const coords = (geom as Point).getCoordinates();
						const lineFeature = new Feature({
							geometry: new LineString([selectedCoords, coords]),
						});
						connectionsSource.addFeature(lineFeature);
					}
				}
			} catch (e) {
				// Invalid JSON, ignore
			}
		});
	}, [highlightedLabel, selectedMarkerId]);

	// Handle dragging of selected marker
	useEffect(() => {
		if (!mapInstanceRef.current || !markersLayerRef.current) return;

		// Remove existing modify interaction if any
		if (modifyInteractionRef.current) {
			mapInstanceRef.current.removeInteraction(modifyInteractionRef.current);
			modifyInteractionRef.current = null;
		}

		// Add new modify interaction if a marker is selected
		if (selectedMarkerId && onMarkerDragRef.current && !drawingPropsRef.current.drawMode) {
			const source = markersLayerRef.current.getSource();
			if (!source) return;

			const selectedFeature = source.getFeatureById(selectedMarkerId);
			if (selectedFeature) {
				const features = new Collection([selectedFeature]);
				const modifyInteraction = new Modify({
					features,
					// Disable default hover styling
					style: undefined,
				});

				modifyInteraction.on('modifyend', (evt: ModifyEvent) => {
					const feature = evt.features.getArray()[0];
					if (feature) {
						const geometry = feature.getGeometry();
						if (geometry && geometry.getType() === 'Point') {
							const point = geometry as Point;
							const coords = point.getCoordinates();
							const [lon, lat] = toLonLat(coords);
							const markerId = feature.getId() as string;
							onMarkerDragRef.current?.(markerId, lon, lat);
						}
					}
				});

				mapInstanceRef.current.addInteraction(modifyInteraction);
				modifyInteractionRef.current = modifyInteraction;
			}
		}

		return () => {
			if (modifyInteractionRef.current && mapInstanceRef.current) {
				mapInstanceRef.current.removeInteraction(modifyInteractionRef.current);
				modifyInteractionRef.current = null;
			}
		};
	}, [selectedMarkerId, markers, drawMode]);

	useEffect(() => {
		const source = drawingsLayerRef.current?.getSource();
		if (!source) return;
		source.clear();
		drawings.filter((drawing) => drawing.visible !== false).forEach((drawing) => {
			try {
				const coords = JSON.parse(drawing.coords) as number[][];
				const feature = new Feature({ geometry: new LineString(coords.map((coord) => fromLonLat(coord))), color: drawing.color });
				feature.setId(drawing.id); feature.set('drawing', true); source.addFeature(feature);
			} catch { /* Ignore malformed persisted drawing data. */ }
		});
	}, [drawings]);

	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map) return;
		if (drawInteractionRef.current) { map.removeInteraction(drawInteractionRef.current); drawInteractionRef.current = null; }
		if (!drawMode || drawTool === 'eraser') return;
		const interaction = new Draw({
			source: drawingsLayerRef.current?.getSource() || undefined,
			type: 'LineString',
			freehand: drawTool === 'freehand',
			maxPoints: drawTool === 'line' ? 2 : undefined,
			style: new Style({ stroke: new Stroke({ color: activeLayerColor, width: 2 }) }),
		});
		interaction.on('drawend', (event) => {
			const geometry = event.feature.getGeometry();
			if (!geometry || geometry.getType() !== 'LineString') return;
			const line = geometry as LineString;
			const simplified = drawTool === 'freehand' ? line.simplify(2) as LineString : line;
			const coords = simplified.getCoordinates().map((coord) => toLonLat(coord));
			event.feature.setGeometry(simplified);
			drawingPropsRef.current.onDrawingCreated?.(drawTool, coords);
		});
		map.addInteraction(interaction); drawInteractionRef.current = interaction;
		return () => { map.removeInteraction(interaction); drawInteractionRef.current = null; };
	}, [drawMode, drawTool, activeLayerId, activeLayerColor]);

	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map || !drawMode || drawTool !== 'eraser') return;
		const erase = (event: any) => {
			map.forEachFeatureAtPixel(event.pixel, (feature, layer) => {
				const id = feature.getId() as string;
				if (layer === drawingsLayerRef.current && feature.get('drawing') && !erasedDuringGestureRef.current.has(id)) {
					erasedDuringGestureRef.current.add(id);
					drawingPropsRef.current.onDrawingErase?.(id);
				}
			}, { hitTolerance: 8 });
		};
		map.on('singleclick', erase);
		const viewport = map.getViewport();
		let resetTimer: ReturnType<typeof setTimeout> | null = null;
		const startGesture = () => erasedDuringGestureRef.current.clear();
		const endGesture = () => { if (resetTimer) clearTimeout(resetTimer); resetTimer = setTimeout(() => erasedDuringGestureRef.current.clear(), 250); };
		const drag = (event: globalThis.PointerEvent) => { if (event.buttons) erase({ pixel: map.getEventPixel(event) }); };
		viewport.addEventListener('pointerdown', startGesture);
		viewport.addEventListener('pointerup', endGesture);
		viewport.addEventListener('pointermove', drag);
		return () => { if (resetTimer) clearTimeout(resetTimer); map.un('singleclick', erase); viewport.removeEventListener('pointerdown', startGesture); viewport.removeEventListener('pointerup', endGesture); viewport.removeEventListener('pointermove', drag); };
	}, [drawMode, drawTool]);

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

	// Handle crosshairs target changes
	useEffect(() => {
		if (!crosshairsTarget || !crosshairsLayerRef.current || !mapInstanceRef.current) return;

		const source = crosshairsLayerRef.current.getSource();
		if (!source) return;

		// Clear any existing crosshairs timer
		if (crosshairsTimerRef.current) {
			clearTimeout(crosshairsTimerRef.current);
		}

		// Pan the map to the target
		const view = mapInstanceRef.current.getView();
		const targetCoords = fromLonLat([crosshairsTarget.longitude, crosshairsTarget.latitude]);
		view.animate({
			center: targetCoords,
			duration: 500,
		});

		// Create crosshairs (two perpendicular lines)
		const crosshairSize = 50; // Size in pixels
		const resolution = view.getResolution() || 1;
		const size = crosshairSize * resolution;

		// Horizontal line
		const horizontalLine = new Feature({
			geometry: new LineString([
				[targetCoords[0] - size, targetCoords[1]],
				[targetCoords[0] + size, targetCoords[1]],
			]),
		});

		// Vertical line
		const verticalLine = new Feature({
			geometry: new LineString([
				[targetCoords[0], targetCoords[1] - size],
				[targetCoords[0], targetCoords[1] + size],
			]),
		});

		// Add crosshairs to the layer
		source.clear();
		source.addFeatures([horizontalLine, verticalLine]);

		// Set timer to remove crosshairs after 2 seconds
		crosshairsTimerRef.current = setTimeout(() => {
			source.clear();
			crosshairsTimerRef.current = null;
		}, 2000);

		return () => {
			if (crosshairsTimerRef.current) {
				clearTimeout(crosshairsTimerRef.current);
			}
		};
	}, [crosshairsTarget]);

	return <div ref={mapRef} className='map-container' />;
};
