import { useState, useEffect, useRef } from 'react';

interface GeolocationState {
	// eslint-disable-next-line no-undef
	position: GeolocationPosition | null;
	// eslint-disable-next-line no-undef
	error: GeolocationPositionError | null;
	loading: boolean;
	supported: boolean;
}

export const useGeolocation = (): GeolocationState => {
	// eslint-disable-next-line no-undef
	const [position, setPosition] = useState<GeolocationPosition | null>(null);
	// eslint-disable-next-line no-undef
	const [error, setError] = useState<GeolocationPositionError | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [supported] = useState<boolean>('geolocation' in navigator);
	const watchIdRef = useRef<number | null>(null);

	useEffect(() => {
		if (!supported) {
			return;
		}

		setLoading(true);

		// eslint-disable-next-line no-undef
		const options: PositionOptions = {
			enableHighAccuracy: true,
			timeout: 10000,
			maximumAge: 0,
		};

		// eslint-disable-next-line no-undef
		const handleSuccess = (pos: GeolocationPosition) => {
			setPosition(pos);
			setError(null);
			setLoading(false);
		};

		// eslint-disable-next-line no-undef
		const handleError = (err: GeolocationPositionError) => {
			setError(err);
			setLoading(false);
		};

		// Start watching position
		watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

		// Cleanup on unmount
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
		};
	}, [supported]);

	return {
		position,
		error,
		loading,
		supported,
	};
};
