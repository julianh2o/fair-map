import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Chip,
	IconButton,
	TextField,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
} from '@mui/material';
import { ArrowBack, LocationOn, Check, Delete } from '@mui/icons-material';
import { API_BASE } from '../../services/api';
import { LabelsInput } from '../LabelsInput';

interface Marker {
	id: string;
	name: string;
	description: string | null;
	photo: string | null;
	latitude: number;
	longitude: number;
	labels: string;
	layerId: string;
	layer?: {
		name: string;
		color: string;
	};
}

interface MarkerDetailsProps {
	marker: Marker | null;
	onBack: () => void;
	onSave?: (id: string, data: { name: string; description: string; labels: string[] }) => Promise<void>;
	onDelete?: (id: string) => Promise<void>;
}

export const MarkerDetails = ({ marker, onBack, onSave, onDelete }: MarkerDetailsProps) => {
	const [name, setName] = useState('');
	const [notes, setNotes] = useState('');
	const [labels, setLabels] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [showSaved, setShowSaved] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Update local state when marker changes
	useEffect(() => {
		if (marker) {
			setName(marker.name || '');
			setNotes(marker.description || '');
			try {
				const parsedLabels = JSON.parse(marker.labels || '[]');
				setLabels(Array.isArray(parsedLabels) ? parsedLabels : []);
			} catch (e) {
				console.error('Error parsing labels:', e);
				setLabels([]);
			}
		}
	}, [marker]);

	if (!marker) return null;

	// Convert relative photo URL to absolute URL for development mode
	const getPhotoUrl = (photo: string) => {
		if (photo.startsWith('http')) return photo;
		// Remove /api from API_BASE to get the server base URL
		const serverBase = API_BASE.replace('/api', '');
		return `${serverBase}${photo}`;
	};

	const handleSave = async () => {
		if (!onSave) return;

		setIsSaving(true);
		setShowSaved(false);
		try {
			await onSave(marker.id, {
				name: name,
				description: notes,
				labels: labels,
			});
			setShowSaved(true);
			setTimeout(() => setShowSaved(false), 2000);
		} catch (error) {
			console.error('Error saving marker:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteClick = () => {
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!onDelete) return;
		try {
			await onDelete(marker.id);
			setDeleteDialogOpen(false);
		} catch (error) {
			console.error('Error deleting marker:', error);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			(e.currentTarget as HTMLElement).blur();
		}
	};

	return (
		<Box sx={{ p: 2, pt: 1 }}>
			{/* Back button header */}
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<IconButton
						onClick={onBack}
						sx={{
							mr: 1,
							'&:active': {
								transform: 'scale(0.95)',
							},
						}}>
						<ArrowBack />
					</IconButton>
					<Typography variant='h6'>Marker Details</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					{isSaving && <CircularProgress size={16} />}
					{showSaved && !isSaving && (
						<Check fontSize='small' sx={{ color: 'success.main', animation: 'fadeIn 0.3s ease-in' }} />
					)}
					{onDelete && (
						<IconButton
							onClick={handleDeleteClick}
							size='small'
							sx={{
								color: 'error.main',
								'&:active': {
									transform: 'scale(0.95)',
								},
							}}>
							<Delete fontSize='small' />
						</IconButton>
					)}
				</Box>
			</Box>

			{marker.photo && (
				<Box
					sx={{
						width: '100%',
						height: 200,
						overflow: 'hidden',
						borderRadius: 1,
						bgcolor: 'black',
						mb: 2,
					}}>
					<img
						src={getPhotoUrl(marker.photo)}
						alt={marker.name || 'Marker photo'}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
						}}
					/>
				</Box>
			)}

			<Box sx={{ mb: 2 }}>
				{marker.layer && (
					<Chip
						label={marker.layer.name}
						size='small'
						sx={{
							bgcolor: marker.layer.color,
							color: 'white',
							fontWeight: 'bold',
							mb: 1,
						}}
					/>
				)}
			</Box>

			<TextField
				label='Name'
				value={name}
				onChange={(e) => setName(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				fullWidth
				size='small'
				sx={{ mb: 2 }}
				disabled={isSaving}
			/>
			<TextField
				label='Notes'
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				onBlur={handleSave}
				onKeyDown={handleKeyDown}
				fullWidth
				multiline
				rows={4}
				size='small'
				sx={{ mb: 2 }}
				disabled={isSaving}
			/>

			<Box sx={{ mb: 2 }}>
				<LabelsInput value={labels} onChange={setLabels} onBlur={handleSave} disabled={isSaving} />
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
				<LocationOn fontSize='small' color='action' />
				<Typography variant='body2' color='text.secondary'>
					{marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
				</Typography>
			</Box>

			{/* Delete confirmation dialog */}
			<Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
				<DialogTitle>Delete Marker?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{`Are you sure you want to delete "${marker.name || 'this marker'}"? This action cannot be undone.`}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} color='primary'>
						Cancel
					</Button>
					<Button onClick={handleDeleteConfirm} color='error' variant='contained'>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
