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
	CircularProgress,
	Collapse,
} from '@mui/material';
import { Close, Add, Delete, Circle, Image, CloudUpload, Layers, MyLocation } from '@mui/icons-material';

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
	onLocationClick: () => void;
	locationLoading?: boolean;
	isOpen?: boolean;
	onToggleOpen?: () => void;
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
	onLocationClick,
	locationLoading = false,
	isOpen = true,
	onToggleOpen,
}: LayerManagerProps) => {
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [newLayerName, setNewLayerName] = useState('');
	const [newLayerColor, setNewLayerColor] = useState('#FF5733');

	const handleToggleOpen = () => {
		if (onToggleOpen) {
			onToggleOpen();
		}
	};

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
					// Mobile: bottom sheet
					bottom: { xs: 0, md: 'auto' },
					left: { xs: 0, md: 16 },
					right: { xs: 0, md: 'auto' },
					top: { xs: 'auto', md: 16 },
					zIndex: 1100,
					// Mobile: full width, Desktop: auto width based on content
					width: { xs: '100%', md: isOpen ? 300 : 'auto' },
					maxHeight: { xs: isOpen ? '50vh' : 'auto', sm: isOpen ? '60vh' : 'auto', md: 'calc(100vh - 120px)' },
					overflow: isOpen ? 'auto' : 'visible',
					background: 'rgba(18, 18, 18, 0.95)',
					backdropFilter: 'blur(10px)',
					// Mobile: rounded top corners, Desktop: rounded all corners
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16,
					borderBottomLeftRadius: { xs: 0, md: 4 },
					borderBottomRightRadius: { xs: 0, md: 4 },
					pb: { xs: 'env(safe-area-inset-bottom, 8px)', md: 2 },
				}}>
				{/* Navigation Tabs */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-around',
						alignItems: 'center',
						py: 1.5,
						px: 2,
						minHeight: '60px',
						borderBottom: isOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
					}}>
					<IconButton
						color='primary'
						aria-label='layers menu'
						onClick={handleToggleOpen}
						sx={{
							'&:active': {
								transform: 'scale(0.95)',
							},
						}}>
						<Layers />
					</IconButton>
					<IconButton
						color='primary'
						aria-label='my location'
						onClick={onLocationClick}
						disabled={locationLoading}
						sx={{
							'&:active': {
								transform: 'scale(0.95)',
							},
						}}>
						{locationLoading ? <CircularProgress size={24} /> : <MyLocation />}
					</IconButton>
				</Box>

				{/* Collapsible Content */}
				<Collapse in={isOpen}>
					<Box sx={{ p: 2, pt: 1 }}>
						{/* Drag handle - only visible on mobile when open */}
						<Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 1 }}>
							<Box
								sx={{
									width: 40,
									height: 4,
									borderRadius: 2,
									backgroundColor: 'rgba(255, 255, 255, 0.3)',
								}}
							/>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
							<Typography variant='h6'>Layers</Typography>
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
					</Box>
				</Collapse>
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
