import React, { useState, useEffect, useRef } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Box,
	CircularProgress,
	IconButton,
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import { LabelsInput } from '../LabelsInput';
import { uploadImage, API_BASE } from '../../services/api';

export interface MarkerData {
	id?: string;
	name: string;
	description: string;
	photo?: string;
	latitude: number;
	longitude: number;
	layerId: string;
	labels?: string[];
}

interface Layer {
	id: string;
	name: string;
	color: string;
}

interface MarkerDialogProps {
	open: boolean;
	marker?: MarkerData | null;
	latitude: number;
	longitude: number;
	layers: Layer[];
	activeLayerId?: string;
	onClose: () => void;
	onSave: (marker: MarkerData) => void;
}

export const MarkerDialog = ({
	open,
	marker,
	latitude,
	longitude,
	layers,
	activeLayerId,
	onClose,
	onSave,
}: MarkerDialogProps) => {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [photo, setPhoto] = useState('');
	const [layerId, setLayerId] = useState('');
	const [labels, setLabels] = useState<string[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	// eslint-disable-next-line no-undef
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (marker) {
			setName(marker.name);
			setDescription(marker.description || '');
			setPhoto(marker.photo || '');
			setLayerId(marker.layerId);
			setLabels(marker.labels || []);
		} else {
			setName('');
			setDescription('');
			setPhoto('');
			// Use activeLayerId if provided, otherwise fall back to first layer
			setLayerId(activeLayerId || (layers.length > 0 ? layers[0].id : ''));
			setLabels([]);
		}
		setUploadError(null);
	}, [marker, layers, activeLayerId, open]);

	// eslint-disable-next-line no-undef
	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setUploading(true);
		setUploadError(null);

		try {
			const url = await uploadImage(file);
			setPhoto(url);
		} catch (error) {
			console.error('Error uploading image:', error);
			setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
		} finally {
			setUploading(false);
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleRemovePhoto = () => {
		setPhoto('');
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const getPhotoUrl = (photoUrl: string) => {
		if (photoUrl.startsWith('http')) return photoUrl;
		const serverBase = API_BASE.replace('/api', '');
		return `${serverBase}${photoUrl}`;
	};

	const handleSave = () => {
		if (!name.trim() || !layerId) return;

		onSave({
			...(marker?.id && { id: marker.id }),
			name: name.trim(),
			description: description.trim(),
			photo: photo.trim() || undefined,
			latitude,
			longitude,
			layerId,
			labels,
		});

		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
			<DialogTitle>{marker ? 'Edit Marker' : 'New Marker'}</DialogTitle>
			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
					{/* eslint-disable-next-line jsx-a11y/no-autofocus */}
					<TextField label='Name' value={name} onChange={(e) => setName(e.target.value)} fullWidth required autoFocus />
					<TextField
						label='Description'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						fullWidth
						multiline
						rows={3}
					/>

					{/* Image Upload Section */}
					<Box>
						<input
							type='file'
							ref={fileInputRef}
							onChange={handleFileSelect}
							accept='image/*'
							style={{ display: 'none' }}
						/>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
							<Button
								variant='outlined'
								startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
								onClick={handleUploadClick}
								disabled={uploading}
								fullWidth>
								{photo ? 'Change Image' : 'Upload Image'}
							</Button>
							{photo && (
								<IconButton onClick={handleRemovePhoto} color='error' disabled={uploading}>
									<Delete />
								</IconButton>
							)}
						</Box>
						{uploadError && <Box sx={{ color: 'error.main', fontSize: '0.875rem', mt: 0.5 }}>{uploadError}</Box>}
						{photo && !uploading && (
							<Box
								sx={{
									mt: 2,
									width: '100%',
									height: 200,
									overflow: 'hidden',
									borderRadius: 1,
									bgcolor: 'black',
								}}>
								<img
									src={getPhotoUrl(photo)}
									alt='Marker preview'
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'contain',
									}}
								/>
							</Box>
						)}
					</Box>

					<LabelsInput value={labels} onChange={setLabels} />
					<FormControl fullWidth required>
						<InputLabel>Layer</InputLabel>
						<Select value={layerId} onChange={(e) => setLayerId(e.target.value)} label='Layer'>
							{layers.map((layer) => (
								<MenuItem key={layer.id} value={layer.id}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Box
											sx={{
												width: 16,
												height: 16,
												borderRadius: '50%',
												backgroundColor: layer.color,
											}}
										/>
										{layer.name}
									</Box>
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Box sx={{ display: 'flex', gap: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
						<span>Coordinates:</span>
						<span>
							{latitude.toFixed(6)}, {longitude.toFixed(6)}
						</span>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button onClick={handleSave} variant='contained' disabled={!name.trim() || !layerId || uploading}>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
};
