import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { LabelsInput } from '../LabelsInput';

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
	onClose: () => void;
	onSave: (marker: MarkerData) => void;
}

export const MarkerDialog = ({ open, marker, latitude, longitude, layers, onClose, onSave }: MarkerDialogProps) => {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [photo, setPhoto] = useState('');
	const [layerId, setLayerId] = useState('');
	const [labels, setLabels] = useState<string[]>([]);

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
			setLayerId(layers.length > 0 ? layers[0].id : '');
			setLabels([]);
		}
	}, [marker, layers, open]);

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
					<TextField
						label='Photo URL (optional)'
						value={photo}
						onChange={(e) => setPhoto(e.target.value)}
						fullWidth
						placeholder='https://...'
					/>
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
				<Button onClick={handleSave} variant='contained' disabled={!name.trim() || !layerId}>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
};
