import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import { fromLonLat, toLonLat } from 'ol/proj';

import { APP_TITLE, PAGE_TITLE_HOME } from '../utils/constants';
import { MapComponent, OverlayConfig, MapMarker, ImageOverlay, UserLocation } from '../components/Map';
import { BottomToolbar } from '../components/BottomToolbar';
import { OverlayControls } from '../components/OverlayControls';
import { MarkerDialog, MarkerData } from '../components/MarkerDialog';
import { LayerManager } from '../components/LayerManager';
import { layersApi, markersApi, Layer, Marker } from '../services/api';
import { useGeolocation } from '../hooks';

export const Home = () => {
	const [center, setCenter] = useState<[number, number] | null>(null);
	const [satelliteVisible, setSatelliteVisible] = useState(true);
	const [showOverlayControls, setShowOverlayControls] = useState(false);
	const [overlayConfig, setOverlayConfig] = useState<OverlayConfig | null>(null);
	const [imageOverlays, setImageOverlays] = useState<ImageOverlay[]>([]);
	const [layers, setLayers] = useState<Layer[]>([]);
	const [markers, setMarkers] = useState<Marker[]>([]);
	const [markerDialogOpen, setMarkerDialogOpen] = useState(false);
	const [markerPosition, setMarkerPosition] = useState<{ lat: number; lon: number } | null>(null);
	const [showLayerManager, setShowLayerManager] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
		} catch (err) {
			console.error('Error creating layer:', err);
			setError('Failed to create layer');
		}
	};

	const handleDeleteLayer = async (layerId: string) => {
		try {
			await layersApi.delete(layerId);
			setLayers(layers.filter((l) => l.id !== layerId));
			setMarkers(markers.filter((m) => m.layerId !== layerId));
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
			setImageOverlays(imageOverlays.map((overlay) => (overlay.id === id ? { ...overlay, visible: !overlay.visible } : overlay)));
		},
		[imageOverlays],
	);

	const handleLocationClick = useCallback(() => {
		setShowUserLocation(true);
		setTrackingEnabled(true);
	}, []);

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
				/>
				<BottomToolbar
					onOpenLayerManager={() => setShowLayerManager(true)}
					onLocationClick={handleLocationClick}
					locationLoading={locationLoading}
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
				{showLayerManager && (
					<LayerManager
						layers={layers}
						imageOverlays={imageOverlays}
						satelliteVisible={satelliteVisible}
						onToggleVisibility={handleToggleLayerVisibility}
						onImageOverlayToggle={handleImageOverlayToggle}
						onAddLayer={handleAddLayer}
						onDeleteLayer={handleDeleteLayer}
						onClose={() => setShowLayerManager(false)}
					/>
				)}
				{markerPosition && (
					<MarkerDialog
						open={markerDialogOpen}
						latitude={markerPosition.lat}
						longitude={markerPosition.lon}
						layers={layers}
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
