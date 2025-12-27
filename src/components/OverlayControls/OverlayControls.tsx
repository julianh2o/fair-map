import React, { useState } from 'react';
import {
	Paper,
	Box,
	Slider,
	Typography,
	IconButton,
	Switch,
	FormControlLabel,
	TextField,
	Divider,
	List,
	ListItem,
	ListItemText,
} from '@mui/material';
import { Close, ZoomIn, ZoomOut, ArrowUpward, ArrowDownward, ArrowBack, ArrowForward } from '@mui/icons-material';
import { OverlayConfig, ImageOverlay } from '../Map';

interface OverlayControlsProps {
	config: OverlayConfig;
	onConfigChange: (config: OverlayConfig) => void;
	imageOverlays: ImageOverlay[];
	onImageOverlaysChange: (overlays: ImageOverlay[]) => void;
	onClose: () => void;
}

export const OverlayControls = ({
	config,
	onConfigChange,
	imageOverlays,
	onImageOverlaysChange,
	onClose,
}: OverlayControlsProps) => {
	const [moveStep, setMoveStep] = useState(2);

	const handleImageOverlayToggle = (id: string) => {
		onImageOverlaysChange(
			imageOverlays.map((overlay) => (overlay.id === id ? { ...overlay, visible: !overlay.visible } : overlay)),
		);
	};

	const handleOpacityChange = (_event: Event, value: number | number[]) => {
		onConfigChange({ ...config, opacity: value as number });
	};

	// eslint-disable-next-line no-undef
	const handleMoveStepChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseFloat(event.target.value);
		if (!isNaN(value) && value > 0) {
			setMoveStep(value);
		}
	};

	const adjustPosition = (dx: number, dy: number) => {
		const [minX, minY, maxX, maxY] = config.extent;
		onConfigChange({
			...config,
			extent: [minX + dx, minY + dy, maxX + dx, maxY + dy],
		});
	};

	const adjustWidth = (factor: number) => {
		const [minX, minY, maxX, maxY] = config.extent;
		const centerX = (minX + maxX) / 2;
		const width = (maxX - minX) * factor;
		onConfigChange({
			...config,
			extent: [centerX - width / 2, minY, centerX + width / 2, maxY],
		});
	};

	const adjustHeight = (factor: number) => {
		const [minX, minY, maxX, maxY] = config.extent;
		const centerY = (minY + maxY) / 2;
		const height = (maxY - minY) * factor;
		onConfigChange({
			...config,
			extent: [minX, centerY - height / 2, maxX, centerY + height / 2],
		});
	};

	const adjustRotation = (delta: number) => {
		const currentRotation = config.rotation || 0;
		onConfigChange({
			...config,
			rotation: currentRotation + delta,
		});
	};

	return (
		<Paper
			elevation={8}
			sx={{
				position: 'fixed',
				top: 16,
				right: 16,
				zIndex: 1100,
				p: 2,
				width: 280,
				maxHeight: 'calc(100vh - 120px)',
				overflow: 'auto',
				background: 'rgba(18, 18, 18, 0.95)',
				backdropFilter: 'blur(10px)',
			}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				<Typography variant='h6'>Overlay Settings</Typography>
				<IconButton size='small' onClick={onClose}>
					<Close />
				</IconButton>
			</Box>

			<Typography variant='subtitle2' gutterBottom>
				Image Layers
			</Typography>
			<List dense sx={{ mb: 2 }}>
				{imageOverlays.map((overlay) => (
					<ListItem
						key={overlay.id}
						secondaryAction={
							<Switch edge='end' checked={overlay.visible} onChange={() => handleImageOverlayToggle(overlay.id)} />
						}
						sx={{ px: 0 }}>
						<ListItemText primary={overlay.name} />
					</ListItem>
				))}
			</List>

			<Divider sx={{ my: 2 }} />

			<Typography variant='subtitle2' gutterBottom>
				Global Settings
			</Typography>
			<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
				These settings apply to all image layers
			</Typography>

			<Typography gutterBottom>Opacity</Typography>
			<Slider
				value={config.opacity}
				onChange={handleOpacityChange}
				min={0}
				max={1}
				step={0.05}
				marks
				valueLabelDisplay='auto'
				sx={{ mb: 3 }}
			/>

			<Typography gutterBottom>Position</Typography>
			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
				<Box />
				<IconButton onClick={() => adjustPosition(0, moveStep)} size='small'>
					<ArrowUpward />
				</IconButton>
				<Box />
				<IconButton onClick={() => adjustPosition(-moveStep, 0)} size='small'>
					<ArrowBack />
				</IconButton>
				<TextField
					type='number'
					value={moveStep}
					onChange={handleMoveStepChange}
					size='small'
					inputProps={{ min: 0.1, step: 0.5, style: { textAlign: 'center' } }}
					sx={{ '& input': { py: 0.5, fontSize: '0.875rem' } }}
				/>
				<IconButton onClick={() => adjustPosition(moveStep, 0)} size='small'>
					<ArrowForward />
				</IconButton>
				<Box />
				<IconButton onClick={() => adjustPosition(0, -moveStep)} size='small'>
					<ArrowDownward />
				</IconButton>
				<Box />
			</Box>
			<Typography
				variant='caption'
				color='text.secondary'
				sx={{ display: 'block', textAlign: 'center', mt: -1, mb: 2 }}>
				Move step (meters)
			</Typography>

			<Typography gutterBottom>Width</Typography>
			<Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
				<IconButton onClick={() => adjustWidth(0.9)} size='small' title='Narrower'>
					<ZoomOut />
				</IconButton>
				<IconButton onClick={() => adjustWidth(1.1)} size='small' title='Wider'>
					<ZoomIn />
				</IconButton>
			</Box>

			<Typography gutterBottom>Height</Typography>
			<Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
				<IconButton onClick={() => adjustHeight(0.9)} size='small' title='Shorter'>
					<ZoomOut />
				</IconButton>
				<IconButton onClick={() => adjustHeight(1.1)} size='small' title='Taller'>
					<ZoomIn />
				</IconButton>
			</Box>

			<Typography gutterBottom>Rotation</Typography>
			<Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
				<IconButton onClick={() => adjustRotation(-1)} size='small'>
					<ArrowBack />
				</IconButton>
				<Typography sx={{ minWidth: '60px', textAlign: 'center' }}>{(config.rotation || 0).toFixed(1)}°</Typography>
				<IconButton onClick={() => adjustRotation(1)} size='small'>
					<ArrowForward />
				</IconButton>
			</Box>
			<Typography variant='caption' color='text.secondary' sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
				Click arrows to rotate ±1°
			</Typography>
		</Paper>
	);
};
