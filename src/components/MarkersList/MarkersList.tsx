import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { Circle, LocationOn } from '@mui/icons-material';

interface Layer {
	id: string;
	name: string;
	color: string;
	visible: boolean;
	_count?: { markers: number };
}

interface Marker {
	id: string;
	name: string;
	description: string | null;
	photo: string | null;
	latitude: number;
	longitude: number;
	layerId: string;
}

interface MarkersListProps {
	layers: Layer[];
	markers: Marker[];
	onMarkerClick: (markerId: string) => void;
}

export const MarkersList = ({ layers, markers, onMarkerClick }: MarkersListProps) => {
	// Group markers by layer
	const markersByLayer = layers.map((layer) => ({
		layer,
		markers: markers.filter((marker) => marker.layerId === layer.id),
	}));

	return (
		<Box sx={{ p: 2, pt: 1 }}>
			{/* Drag handle - only visible on mobile */}
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
				<Typography variant='h6'>Markers</Typography>
			</Box>

			{markersByLayer.map(({ layer, markers: layerMarkers }) => (
				<Box key={layer.id} sx={{ mb: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
						<Circle sx={{ color: layer.color, fontSize: 16, mr: 1 }} />
						<Typography variant='subtitle2'>
							{layer.name} ({layerMarkers.length})
						</Typography>
					</Box>
					{layerMarkers.length === 0 ? (
						<Typography variant='body2' sx={{ pl: 3, color: 'text.secondary', fontStyle: 'italic' }}>
							No markers in this layer
						</Typography>
					) : (
						<List dense sx={{ pl: 1 }}>
							{layerMarkers.map((marker) => (
								<ListItem key={marker.id} disablePadding>
									<ListItemButton onClick={() => onMarkerClick(marker.id)}>
										<ListItemIcon sx={{ minWidth: 32 }}>
											<LocationOn fontSize='small' />
										</ListItemIcon>
										<ListItemText
											primary={marker.name || 'Unnamed marker'}
											secondary={marker.description}
											primaryTypographyProps={{
												variant: 'body2',
											}}
											secondaryTypographyProps={{
												variant: 'caption',
												noWrap: true,
											}}
										/>
									</ListItemButton>
								</ListItem>
							))}
						</List>
					)}
					<Divider sx={{ mt: 1 }} />
				</Box>
			))}

			{markers.length === 0 && (
				<Typography variant='body2' sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
					No markers yet. Long-press on the map to add a marker.
				</Typography>
			)}
		</Box>
	);
};
