import { useState, useRef } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	LinearProgress,
	Alert,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import exifr from 'exifr';
import { API_BASE } from '../../services/api';

interface ImageUploadProps {
	open: boolean;
	onClose: () => void;
	onUploadComplete: (count: number) => void;
	activeLayerId: string;
}

interface ImageWithMetadata {
	// eslint-disable-next-line no-undef
	file: File;
	latitude?: number;
	longitude?: number;
	hasGPS: boolean;
}

export const ImageUpload = ({ open, onClose, onUploadComplete, activeLayerId }: ImageUploadProps) => {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [imagesWithGPS, setImagesWithGPS] = useState(0);
	const [imagesWithoutGPS, setImagesWithoutGPS] = useState(0);
	// eslint-disable-next-line no-undef
	const fileInputRef = useRef<HTMLInputElement>(null);

	// eslint-disable-next-line no-undef
	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		setUploading(true);
		setError(null);
		setSuccess(false);
		setProgress(0);

		try {
			// Process all images to extract GPS data
			const imageMetadataPromises = Array.from(files).map(async (file): Promise<ImageWithMetadata> => {
				try {
					const exifData = await exifr.parse(file, { gps: true });
					if (exifData && exifData.latitude && exifData.longitude) {
						return {
							file,
							latitude: exifData.latitude,
							longitude: exifData.longitude,
							hasGPS: true,
						};
					}
				} catch (err) {
					console.warn(`Failed to parse EXIF for ${file.name}:`, err);
				}
				return { file, hasGPS: false };
			});

			const imagesMetadata = await Promise.all(imageMetadataPromises);

			// Separate images with and without GPS
			const withGPS = imagesMetadata.filter((img) => img.hasGPS);
			const withoutGPS = imagesMetadata.filter((img) => !img.hasGPS);

			setImagesWithGPS(withGPS.length);
			setImagesWithoutGPS(withoutGPS.length);

			if (withGPS.length === 0) {
				setError('None of the selected images have GPS data');
				setUploading(false);
				return;
			}

			// Upload images with GPS data
			let successCount = 0;
			for (let i = 0; i < withGPS.length; i++) {
				const imageData = withGPS[i];
				setProgress(((i + 1) / withGPS.length) * 100);

				try {
					// Upload image file
					// eslint-disable-next-line no-undef
					const formData = new FormData();
					formData.append('image', imageData.file);

					const uploadResponse = await fetch(`${API_BASE}/upload/image`, {
						method: 'POST',
						body: formData,
					});

					if (!uploadResponse.ok) {
						throw new Error('Failed to upload image');
					}

					const { url } = await uploadResponse.json();

					// Create marker with image
					const markerResponse = await fetch(`${API_BASE}/markers`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							name: '',
							description: ``,
							photo: url,
							latitude: imageData.latitude,
							longitude: imageData.longitude,
							layerId: activeLayerId,
						}),
					});

					if (!markerResponse.ok) {
						throw new Error('Failed to create marker');
					}

					successCount++;
				} catch (err) {
					console.error(`Failed to process ${imageData.file.name}:`, err);
				}
			}

			setSuccess(true);
			onUploadComplete(successCount);

			// Auto-close after success
			setTimeout(() => {
				handleClose();
			}, 2000);
		} catch (err) {
			console.error('Upload error:', err);
			setError(err instanceof Error ? err.message : 'Failed to upload images');
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		setProgress(0);
		setError(null);
		setSuccess(false);
		setImagesWithGPS(0);
		setImagesWithoutGPS(0);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		onClose();
	};

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<Dialog open={open} onClose={uploading ? undefined : handleClose} maxWidth='sm' fullWidth>
			<DialogTitle>Upload Geotagged Images</DialogTitle>
			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
					<Typography variant='body2' color='text.secondary'>
						Select images with GPS data (EXIF) to add them as markers on the map.
					</Typography>

					<input
						ref={fileInputRef}
						type='file'
						accept='image/*'
						multiple
						onChange={handleFileSelect}
						style={{ display: 'none' }}
					/>

					{!uploading && !success && (
						<Button
							variant='contained'
							startIcon={<CloudUpload />}
							onClick={handleButtonClick}
							fullWidth
							size='large'
							sx={{ mt: 1 }}>
							Select Images
						</Button>
					)}

					{uploading && (
						<Box>
							<Typography variant='body2' gutterBottom>
								Uploading {imagesWithGPS} image{imagesWithGPS !== 1 ? 's' : ''}...
							</Typography>
							<LinearProgress variant='determinate' value={progress} sx={{ mt: 1 }} />
							<Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
								{Math.round(progress)}%
							</Typography>
						</Box>
					)}

					{success && (
						<Alert severity='success' icon={<CheckCircle />}>
							Successfully uploaded {imagesWithGPS} image{imagesWithGPS !== 1 ? 's' : ''}!
							{imagesWithoutGPS > 0 && ` (${imagesWithoutGPS} skipped - no GPS data)`}
						</Alert>
					)}

					{error && (
						<Alert severity='error' icon={<ErrorIcon />}>
							{error}
							{imagesWithoutGPS > 0 && (
								<Typography variant='caption' display='block' sx={{ mt: 1 }}>
									{imagesWithoutGPS} image{imagesWithoutGPS !== 1 ? 's' : ''} without GPS data
								</Typography>
							)}
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={uploading}>
					{success ? 'Close' : 'Cancel'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
