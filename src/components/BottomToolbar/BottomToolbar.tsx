import { Paper, IconButton, Box } from '@mui/material';
import { MyLocation, Layers, Satellite, Map } from '@mui/icons-material';
import { LayerType } from '../Map/Map';

interface BottomToolbarProps {
	onToggleLayer: () => void;
	currentLayer: LayerType;
	onOpenLayerManager: () => void;
}

export const BottomToolbar = ({ onToggleLayer, currentLayer, onOpenLayerManager }: BottomToolbarProps) => {
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
					aria-label={currentLayer === 'street' ? 'switch to satellite' : 'switch to street'}
					onClick={onToggleLayer}
					sx={{
						'&:active': {
							transform: 'scale(0.95)',
						},
					}}>
					{currentLayer === 'street' ? <Satellite /> : <Map />}
				</IconButton>
				<IconButton
					color='primary'
					aria-label='my location'
					sx={{
						'&:active': {
							transform: 'scale(0.95)',
						},
					}}>
					<MyLocation />
				</IconButton>
			</Box>
		</Paper>
	);
};
