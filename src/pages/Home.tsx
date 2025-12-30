import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { fromLonLat, toLonLat } from 'ol/proj';

import { APP_TITLE, PAGE_TITLE_HOME } from '../utils/constants';
import { MapComponent, OverlayConfig, MapMarker, ImageOverlay, UserLocation } from '../components/Map';
import { OverlayControls } from '../components/OverlayControls';
import { MarkerDialog, MarkerData } from '../components/MarkerDialog';
import { MarkerDetails } from '../components/MarkerDetails';
import { LayerManager } from '../components/LayerManager';
import { MarkersList } from '../components/MarkersList';
import { ImageUpload } from '../components/ImageUpload';
import { layersApi, markersApi, Layer, Marker } from '../services/api';
import { useGeolocation } from '../hooks';

interface MarkerWithLayerInfo extends Omit<Marker, 'layer'> {
	layer?: {
		name: string;
		color: string;
	};
}

export const Home = () => {
	const [center, setCenter] = useState<[number, number] | null>(null);
	const [satelliteVisible, setSatelliteVisible] = useState(true);
	const [showOverlayControls, setShowOverlayControls] = useState(false);
	const [overlayConfig, setOverlayConfig] = useState<OverlayConfig | null>(null);
	const [imageOverlays, setImageOverlays] = useState<ImageOverlay[]>([]);
	const [layers, setLayers] = useState<Layer[]>([]);
	const [markers, setMarkers] = useState<Marker[]>([]);
	const [activeLayerId, setActiveLayerId] = useState<string>('');
	const [markerDialogOpen, setMarkerDialogOpen] = useState(false);
	const [markerPosition, setMarkerPosition] = useState<{ lat: number; lon: number } | null>(null);
	const [isLayerManagerOpen, setIsLayerManagerOpen] = useState(true);
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [panelView, setPanelView] = useState<'layers' | 'markers' | 'marker-details'>('layers');
	const [previousView, setPreviousView] = useState<'layers' | 'markers'>('layers');
	const [crosshairsTarget, setCrosshairsTarget] = useState<{ latitude: number; longitude: number } | null>(null);
	const [selectedMarker, setSelectedMarker] = useState<MarkerWithLayerInfo | null>(null);
	const [highlightedLabel, setHighlightedLabel] = useState<string | null>(null);

	// Geolocation
	const { position, error: locationError, loading: locationLoading } = useGeolocation();
	const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
	const [showUserLocation, setShowUserLocation] = useState(false);
	const [trackingEnabled, setTrackingEnabled] = useState(false);

	useEffect(() => {
		const loadLocation = () => {
			// Property image layer extent (Web Mercator projection)
			const extent: [number, number, number, number] = [
				-13512968.29039301, 4660853.815933621, -13512858.940393008, 4660987.465933621,
			];

			// Calculate center of extent in Web Mercator
			const centerX = (extent[0] + extent[2]) / 2;
			const centerY = (extent[1] + extent[3]) / 2;

			// Convert to lon/lat
			const [lon, lat] = toLonLat([centerX, centerY]);
			setCenter([lon, lat]);

			setOverlayConfig({
				visible: true,
				opacity: 0.45,
				extent: extent,
				rotation: 0,
			});

			setImageOverlays([
				{
					id: 'property',
					name: 'Property Drawing',
					url: '/property_drawing.png',
					visible: true,
					opacity: 0.7,
					extent: extent,
				},
				{
					id: 'house-lower',
					name: 'House Lower/Middle',
					url: '/house_lower_middle.png',
					visible: true,
					opacity: 0.7,
					extent: extent,
				},
				{
					id: 'house-upper',
					name: 'House Upper',
					url: '/house_upper.png',
					visible: true,
					opacity: 0.7,
					extent: extent,
				},
			]);
		};
		loadLocation();
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [layersData, markersData] = await Promise.all([layersApi.getAll(), markersApi.getAll()]);
				setLayers(layersData);
				setMarkers(markersData);

				if (layersData.length === 0) {
					const defaultLayer = await layersApi.create({ name: 'Default Layer', color: '#FF5733' });
					setLayers([defaultLayer]);
					setActiveLayerId(defaultLayer.id);
				} else {
					// Set the first layer as active on initial load
					setActiveLayerId(layersData[0].id);
				}
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Failed to load data');
			}
		};
		fetchData();

		// Add global function to show overlay settings
		(window as any).showOverlaySettings = () => {
			setShowOverlayControls(true);
		};

		console.log('💡 Tip: Use window.showOverlaySettings() to adjust image overlay position, rotation, and size');

		return () => {
			delete (window as any).showOverlaySettings;
		};
	}, []);

	// Convert geolocation position to UserLocation format
	useEffect(() => {
		if (position) {
			setUserLocation({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				accuracy: position.coords.accuracy,
			});
		}
	}, [position]);

	// Handle geolocation errors
	useEffect(() => {
		if (locationError) {
			let message = 'Location error occurred';
			switch (locationError.code) {
				case 1:
					message = 'Location permission denied. Enable in browser settings.';
					break;
				case 2:
					message = 'Location unavailable. Check GPS/wifi.';
					break;
				case 3:
					message = 'Location request timed out. Try again.';
					break;
			}
			setError(message);
		}
	}, [locationError]);

	// Center on first location when tracking is enabled
	useEffect(() => {
		if (position && trackingEnabled) {
			setCenter([position.coords.longitude, position.coords.latitude]);
			setTrackingEnabled(false);
		}
	}, [position, trackingEnabled]);

	const handleLongPress = useCallback((longitude: number, latitude: number) => {
		setMarkerPosition({ lat: latitude, lon: longitude });
		setMarkerDialogOpen(true);
	}, []);

	const handleSaveMarker = async (markerData: MarkerData) => {
		try {
			const newMarker = await markersApi.create(markerData);
			setMarkers([...markers, newMarker]);
			setMarkerDialogOpen(false);
			setMarkerPosition(null);
		} catch (err) {
			console.error('Error saving marker:', err);
			setError('Failed to save marker');
		}
	};

	const handleToggleLayerVisibility = async (layerId: string, visible: boolean) => {
		try {
			await layersApi.update(layerId, { visible });
			setLayers(layers.map((l) => (l.id === layerId ? { ...l, visible } : l)));
		} catch (err) {
			console.error('Error updating layer:', err);
			setError('Failed to update layer');
		}
	};

	const handleAddLayer = async (name: string, color: string) => {
		try {
			const newLayer = await layersApi.create({ name, color });
			setLayers([...layers, newLayer]);
			// Set the newly created layer as active
			setActiveLayerId(newLayer.id);
		} catch (err) {
			console.error('Error creating layer:', err);
			setError('Failed to create layer');
		}
	};

	const handleDeleteLayer = async (layerId: string) => {
		try {
			await layersApi.delete(layerId);
			const remainingLayers = layers.filter((l) => l.id !== layerId);
			setLayers(remainingLayers);
			setMarkers(markers.filter((m) => m.layerId !== layerId));

			// If the deleted layer was active, switch to the first remaining layer
			if (activeLayerId === layerId && remainingLayers.length > 0) {
				setActiveLayerId(remainingLayers[0].id);
			}
		} catch (err) {
			console.error('Error deleting layer:', err);
			setError('Failed to delete layer');
		}
	};

	const handleImageOverlayToggle = useCallback(
		(id: string) => {
			// Handle satellite layer toggle
			if (id === 'satellite') {
				setSatelliteVisible((prev) => !prev);
				return;
			}
			// Handle regular image overlays
			setImageOverlays(
				imageOverlays.map((overlay) => (overlay.id === id ? { ...overlay, visible: !overlay.visible } : overlay)),
			);
		},
		[imageOverlays],
	);

	const handleUserLocationToggle = useCallback(() => {
		const newValue = !showUserLocation;
		setShowUserLocation(newValue);
		// Enable tracking and center on location when turning on
		if (newValue) {
			setTrackingEnabled(true);
		}
	}, [showUserLocation]);

	const handleUploadImages = useCallback(() => {
		setShowImageUpload(true);
	}, []);

	const handleUploadComplete = useCallback(async (count: number) => {
		// Refresh markers after upload
		try {
			const markersData = await markersApi.getAll();
			setMarkers(markersData);
			setError(`Successfully uploaded ${count} image${count !== 1 ? 's' : ''}!`);
		} catch (err) {
			console.error('Error refreshing markers:', err);
		}
	}, []);

	const handleMarkerClick = useCallback(
		(markerId: string, shouldPanToMarker: boolean = true) => {
			const marker = markers.find((m) => m.id === markerId);
			if (marker) {
				// Get the layer info for the marker
				const layer = layers.find((l) => l.id === marker.layerId);
				const markerWithLayer = layer ? { ...marker, layer: { name: layer.name, color: layer.color } } : marker;

				// Show marker details
				setSelectedMarker(markerWithLayer);

				// Switch to marker details view and open panel
				setPreviousView(panelView === 'marker-details' ? previousView : (panelView as 'layers' | 'markers'));
				setPanelView('marker-details');
				setIsLayerManagerOpen(true);

				// Only pan and show crosshairs if requested (e.g., when clicking from list)
				if (shouldPanToMarker) {
					setCrosshairsTarget({ latitude: marker.latitude, longitude: marker.longitude });

					// Clear crosshairs target after a short delay
					setTimeout(() => {
						setCrosshairsTarget(null);
					}, 2100);
				}
			}
		},
		[markers, layers, panelView, previousView],
	);

	const handleBackFromDetails = useCallback(() => {
		setPanelView(previousView);
		setSelectedMarker(null);
		setHighlightedLabel(null);
	}, [previousView]);

	const handleLabelClick = useCallback((label: string) => {
		setHighlightedLabel((prev) => (prev === label ? null : label));
	}, []);

	const handleSaveMarkerDetails = useCallback(
		async (id: string, data: { name: string; description: string; labels: string[]; layerId?: string }) => {
			try {
				const updatedMarker = await markersApi.update(id, data);

				// Update markers list
				setMarkers(markers.map((m) => (m.id === id ? updatedMarker : m)));

				// Update selected marker with layer info
				if (selectedMarker && selectedMarker.id === id) {
					const layer = layers.find((l) => l.id === updatedMarker.layerId);
					setSelectedMarker(
						layer ? { ...updatedMarker, layer: { name: layer.name, color: layer.color } } : updatedMarker,
					);
				}
			} catch (err) {
				console.error('Error updating marker:', err);
				setError('Failed to update marker');
				throw err;
			}
		},
		[markers, selectedMarker, layers],
	);

	const handleMarkerDrag = useCallback(
		async (markerId: string, longitude: number, latitude: number) => {
			try {
				const updatedMarker = await markersApi.update(markerId, { latitude, longitude });

				// Update markers list
				setMarkers(markers.map((m) => (m.id === markerId ? updatedMarker : m)));

				// Update selected marker if it's the one being dragged
				if (selectedMarker && selectedMarker.id === markerId) {
					const layer = layers.find((l) => l.id === updatedMarker.layerId);
					setSelectedMarker(
						layer ? { ...updatedMarker, layer: { name: layer.name, color: layer.color } } : updatedMarker,
					);
				}
			} catch (err) {
				console.error('Error updating marker position:', err);
				setError('Failed to update marker position');
			}
		},
		[markers, selectedMarker, layers],
	);

	const handleDeleteMarker = useCallback(
		async (markerId: string) => {
			try {
				await markersApi.delete(markerId);

				// Remove marker from list
				setMarkers(markers.filter((m) => m.id !== markerId));

				// Clear selected marker and go back to previous view
				setSelectedMarker(null);
				setPanelView(previousView);
			} catch (err) {
				console.error('Error deleting marker:', err);
				setError('Failed to delete marker');
				throw err;
			}
		},
		[markers, previousView],
	);

	// Compute markers with updated layer visibility
	const markersWithUpdatedLayers = useMemo(() => {
		return markers.map((marker) => {
			const layer = layers.find((l) => l.id === marker.layerId);
			if (layer) {
				return {
					...marker,
					layer: {
						color: layer.color,
						visible: layer.visible,
					},
				};
			}
			return marker;
		});
	}, [markers, layers]);

	if (!center || !overlayConfig || imageOverlays.length === 0) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<>
			<Helmet>
				<title>
					{PAGE_TITLE_HOME} | {APP_TITLE}
				</title>
			</Helmet>
			<Box
				sx={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					overflow: 'hidden',
				}}>
				<MapComponent
					center={center}
					zoom={20}
					satelliteVisible={satelliteVisible}
					overlayConfig={overlayConfig}
					imageOverlays={imageOverlays}
					markers={markersWithUpdatedLayers as MapMarker[]}
					userLocation={userLocation}
					showUserLocation={showUserLocation}
					onLongPress={handleLongPress}
					crosshairsTarget={crosshairsTarget}
					onMarkerClick={(markerId) => handleMarkerClick(markerId, false)}
					selectedMarkerId={selectedMarker?.id || null}
					highlightedLabel={highlightedLabel}
					onMarkerDrag={handleMarkerDrag}
				/>
				{showOverlayControls && (
					<OverlayControls
						config={overlayConfig}
						onConfigChange={setOverlayConfig}
						imageOverlays={imageOverlays}
						onImageOverlaysChange={setImageOverlays}
						onClose={() => setShowOverlayControls(false)}
					/>
				)}
				<LayerManager
					layers={layers}
					activeLayerId={activeLayerId}
					onSetActiveLayer={setActiveLayerId}
					imageOverlays={imageOverlays}
					satelliteVisible={satelliteVisible}
					showUserLocation={showUserLocation}
					onToggleVisibility={handleToggleLayerVisibility}
					onImageOverlayToggle={handleImageOverlayToggle}
					onUserLocationToggle={handleUserLocationToggle}
					onAddLayer={handleAddLayer}
					onDeleteLayer={handleDeleteLayer}
					onUploadImages={handleUploadImages}
					isOpen={isLayerManagerOpen}
					onToggleOpen={() => setIsLayerManagerOpen(!isLayerManagerOpen)}
					view={panelView}
					onViewChange={(view) => {
						setPanelView(view);
						setPreviousView(view);
					}}
					markersListContent={<MarkersList layers={layers} markers={markers} onMarkerClick={handleMarkerClick} />}
					markerDetailsContent={
						<MarkerDetails
							marker={selectedMarker}
							layers={layers}
							onBack={handleBackFromDetails}
							onSave={handleSaveMarkerDetails}
							onDelete={handleDeleteMarker}
							onLabelClick={handleLabelClick}
							highlightedLabel={highlightedLabel}
						/>
					}
				/>
				<ImageUpload
					open={showImageUpload}
					onClose={() => setShowImageUpload(false)}
					onUploadComplete={handleUploadComplete}
					activeLayerId={activeLayerId}
				/>
				{markerPosition && (
					<MarkerDialog
						open={markerDialogOpen}
						latitude={markerPosition.lat}
						longitude={markerPosition.lon}
						layers={layers}
						activeLayerId={activeLayerId}
						onClose={() => {
							setMarkerDialogOpen(false);
							setMarkerPosition(null);
						}}
						onSave={handleSaveMarker}
					/>
				)}
				<Snackbar
					open={!!error}
					autoHideDuration={6000}
					onClose={() => setError(null)}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
					<Alert severity='error' onClose={() => setError(null)}>
						{error}
					</Alert>
				</Snackbar>
			</Box>
		</>
	);
};
