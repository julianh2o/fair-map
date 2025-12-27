import { Paper, IconButton, Box, CircularProgress } from '@mui/material';
import { MyLocation, Layers } from '@mui/icons-material';

interface BottomToolbarProps {
	onOpenLayerManager: () => void;
	onLocationClick: () => void;
	locationLoading?: boolean;
}

export const BottomToolbar = ({ onOpenLayerManager, onLocationClick, locationLoading = false }: BottomToolbarProps) => {
	return (
		<Paper
			elevation={8}
			sx={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 1000,
				borderRadius: '16px 16px 0 0',
				background: 'rgba(18, 18, 18, 0.95)',
				backdropFilter: 'blur(10px)',
				pb: 'env(safe-area-inset-bottom, 0px)',
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-around',
					alignItems: 'center',
					py: 1.5,
					px: 2,
					minHeight: '60px',
				}}>
				<IconButton
					color='primary'
					aria-label='layers menu'
					onClick={onOpenLayerManager}
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
		</Paper>
	);
};
