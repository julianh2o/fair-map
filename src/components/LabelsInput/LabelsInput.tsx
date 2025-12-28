import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { markersApi } from '../../services/api';

interface LabelsInputProps {
	value: string[];
	onChange: (labels: string[]) => void;
	onBlur?: () => void;
	disabled?: boolean;
}

export const LabelsInput = ({ value, onChange, onBlur, disabled }: LabelsInputProps) => {
	const [availableLabels, setAvailableLabels] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState('');

	useEffect(() => {
		const fetchLabels = async () => {
			try {
				const labels = await markersApi.getLabels();
				setAvailableLabels(labels);
			} catch (error) {
				console.error('Error fetching labels:', error);
			}
		};
		fetchLabels();
	}, []);

	const sanitizeLabel = (label: string): string => {
		// Replace spaces with hyphens, allow colons, convert to lowercase
		return label.replace(/\s+/g, '-').toLowerCase().trim();
	};

	const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
		// Check if user typed space or comma to create a new label
		if (newInputValue.includes(' ') || newInputValue.includes(',')) {
			const parts = newInputValue.split(/[\s,]+/).filter((part) => part.length > 0);

			if (parts.length > 0) {
				const newLabels = parts.map(sanitizeLabel).filter((label) => label && !value.includes(label));

				if (newLabels.length > 0) {
					onChange([...value, ...newLabels]);
					// Update available labels
					const uniqueNewLabels = newLabels.filter((label) => !availableLabels.includes(label));
					if (uniqueNewLabels.length > 0) {
						setAvailableLabels([...availableLabels, ...uniqueNewLabels].sort());
					}
				}
				setInputValue('');
			}
		} else {
			setInputValue(newInputValue);
		}
	};

	const handleChange = (event: React.SyntheticEvent, newValue: string[]) => {
		// Sanitize all labels
		const sanitizedLabels = newValue.map(sanitizeLabel).filter((label, index, self) => {
			// Remove duplicates and empty strings
			return label && self.indexOf(label) === index;
		});

		onChange(sanitizedLabels);

		// Add new labels to available labels
		const newLabels = sanitizedLabels.filter((label) => !availableLabels.includes(label));
		if (newLabels.length > 0) {
			setAvailableLabels([...availableLabels, ...newLabels].sort());
		}
	};

	return (
		<Autocomplete
			multiple
			freeSolo
			options={availableLabels}
			value={value}
			inputValue={inputValue}
			onChange={handleChange}
			onInputChange={handleInputChange}
			onBlur={onBlur}
			disabled={disabled}
			renderTags={(tagValue, getTagProps) =>
				tagValue.map((option, index) => (
					// eslint-disable-next-line react/jsx-key
					<Chip
						label={option}
						size='small'
						{...getTagProps({ index })}
						sx={{
							bgcolor: 'primary.main',
							color: 'white',
							'& .MuiChip-deleteIcon': {
								color: 'rgba(255, 255, 255, 0.7)',
								'&:hover': {
									color: 'white',
								},
							},
						}}
					/>
				))
			}
			renderInput={(params) => (
				<TextField
					{...params}
					label='Labels'
					size='small'
					placeholder='Type and press space or comma'
					helperText='No spaces allowed. Use hyphens or colons. Press space or comma to add.'
				/>
			)}
		/>
	);
};
