import React, { useState } from 'react';
import {
	Paper,
	Box,
	Typography,
	IconButton,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Switch,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
} from '@mui/material';
import { Close, Add, Delete, Circle, Image, CloudUpload } from '@mui/icons-material';

interface Layer {
	id: string;
	name: string;
	color: string;
	visible: boolean;
	_count?: { markers: number };
}

interface ImageOverlay {
	id: string;
	name: string;
	url: string;
	visible: boolean;
	opacity: number;
	extent: [number, number, number, number];
	rotation?: number;
}

interface LayerManagerProps {
	layers: Layer[];
	imageOverlays: ImageOverlay[];
	satelliteVisible: boolean;
	onToggleVisibility: (id: string, visible: boolean) => void;
	onImageOverlayToggle: (id: string) => void;
	onAddLayer: (name: string, color: string) => void;
	onDeleteLayer: (id: string) => void;
	onUploadImages: () => void;
	onClose: () => void;
}

export const LayerManager = ({
	layers,
	imageOverlays,
	satelliteVisible,
	onToggleVisibility,
	onImageOverlayToggle,
	onAddLayer,
	onDeleteLayer,
	onUploadImages,
	onClose,
}: LayerManagerProps) => {
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [newLayerName, setNewLayerName] = useState('');
	const [newLayerColor, setNewLayerColor] = useState('#FF5733');

	const handleAddLayer = () => {
		if (newLayerName.trim()) {
			onAddLayer(newLayerName.trim(), newLayerColor);
			setNewLayerName('');
			setNewLayerColor('#FF5733');
			setAddDialogOpen(false);
		}
	};

	return (
		<>
			<Paper
				elevation={8}
				sx={{
					position: 'fixed',
					top: 16,
					left: 16,
					zIndex: 1100,
					p: 2,
					width: 300,
					maxHeight: 'calc(100vh - 120px)',
					overflow: 'auto',
					background: 'rgba(18, 18, 18, 0.95)',
					backdropFilter: 'blur(10px)',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
					<Typography variant='h6'>Layers</Typography>
					<IconButton size='small' onClick={onClose}>
						<Close />
					</IconButton>
				</Box>

				<Typography variant='subtitle2' sx={{ mb: 1 }}>
					Image Layers
				</Typography>
				<List dense>
					{/* Satellite layer */}
					<ListItem
						key='satellite'
						secondaryAction={
							<Switch
								edge='end'
								checked={satelliteVisible}
								onChange={() => onImageOverlayToggle('satellite')}
								size='small'
							/>
						}>
						<ListItemIcon>
							<Image />
						</ListItemIcon>
						<ListItemText primary='Satellite' />
					</ListItem>
					{imageOverlays.map((overlay) => (
						<ListItem
							key={overlay.id}
							secondaryAction={
								<Switch
									edge='end'
									checked={overlay.visible}
									onChange={() => onImageOverlayToggle(overlay.id)}
									size='small'
								/>
							}>
							<ListItemIcon>
								<Image />
							</ListItemIcon>
							<ListItemText primary={overlay.name} />
						</ListItem>
					))}
				</List>

				<Typography variant='subtitle2' sx={{ mb: 1, mt: 2 }}>
					Marker Layers
				</Typography>
				<List dense>
					{layers.map((layer) => (
						<ListItem
							key={layer.id}
							secondaryAction={
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<Switch
										checked={layer.visible}
										onChange={(e) => onToggleVisibility(layer.id, e.target.checked)}
										size='small'
									/>
									<IconButton
										edge='end'
										size='small'
										onClick={() => onDeleteLayer(layer.id)}
										disabled={layers.length === 1}>
										<Delete fontSize='small' />
									</IconButton>
								</Box>
							}>
							<ListItemIcon>
								<Circle sx={{ color: layer.color }} />
							</ListItemIcon>
							<ListItemText primary={layer.name} secondary={`${layer._count?.markers || 0} markers`} />
						</ListItem>
					))}
				</List>

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
					<Button variant='contained' startIcon={<Add />} fullWidth onClick={() => setAddDialogOpen(true)}>
						Add Marker Layer
					</Button>
					<Button variant='outlined' startIcon={<CloudUpload />} fullWidth onClick={onUploadImages}>
						Upload Geotagged Images
					</Button>
				</Box>
			</Paper>

			<Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth='xs' fullWidth>
				<DialogTitle>Add New Layer</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
						<TextField
							label='Layer Name'
							value={newLayerName}
							onChange={(e) => setNewLayerName(e.target.value)}
							fullWidth
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
						/>
						<Box>
							<Typography variant='body2' gutterBottom>
								Color
							</Typography>
							<input
								type='color'
								value={newLayerColor}
								onChange={(e) => setNewLayerColor(e.target.value)}
								style={{
									width: '100%',
									height: '40px',
									border: '1px solid rgba(255,255,255,0.23)',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
							/>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
					<Button onClick={handleAddLayer} variant='contained' disabled={!newLayerName.trim()}>
						Add
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};
