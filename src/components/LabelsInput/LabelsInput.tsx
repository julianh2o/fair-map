import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { markersApi } from '../../services/api';

interface LabelsInputProps {
	value: string[];
	onChange: (labels: string[]) => void;
	onBlur?: () => void;
	disabled?: boolean;
	onLabelClick?: (label: string) => void;
	highlightedLabel?: string | null;
}

export const LabelsInput = ({
	value,
	onChange,
	onBlur,
	disabled,
	onLabelClick,
	highlightedLabel,
}: LabelsInputProps) => {
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
				tagValue.map((option, index) => {
					const isHighlighted = highlightedLabel === option;
					const tagProps = getTagProps({ index });
					return (
						// eslint-disable-next-line react/jsx-key
						<Chip
							label={option}
							size='small'
							{...tagProps}
							onClick={(e) => {
								if (onLabelClick) {
									e.stopPropagation();
									onLabelClick(option);
								}
							}}
							sx={{
								bgcolor: isHighlighted ? '#FF8C00' : 'primary.main',
								color: 'white',
								cursor: onLabelClick ? 'pointer' : 'default',
								transition: 'all 0.2s',
								'&:hover': onLabelClick
									? {
											opacity: 0.8,
											transform: 'scale(1.05)',
										}
									: {},
								'& .MuiChip-deleteIcon': {
									color: 'rgba(255, 255, 255, 0.7)',
									'&:hover': {
										color: 'white',
									},
								},
							}}
						/>
					);
				})
			}
			renderOption={(props, option) => {
				const isHighlighted = highlightedLabel === option;
				return (
					// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
					<li
						{...props}
						onClick={(e) => {
							if (onLabelClick) {
								onLabelClick(option);
								e.preventDefault();
								e.stopPropagation();
							} else {
								// Only add the label if we're not in highlight mode
								const newValue = [...value, option];
								onChange(newValue);
							}
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								if (onLabelClick) {
									onLabelClick(option);
									e.preventDefault();
									e.stopPropagation();
								}
							}
						}}
						style={{
							...props.style,
							backgroundColor: isHighlighted ? 'rgba(255, 140, 0, 0.2)' : props.style?.backgroundColor,
							fontWeight: isHighlighted ? 'bold' : 'normal',
							cursor: 'pointer',
						}}>
						{option}
						{isHighlighted && ' ✓'}
					</li>
				);
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					label='Labels'
					size='small'
					placeholder='Type and press space or comma'
					helperText={
						onLabelClick
							? 'Click labels to highlight on map. Type and press space/comma to add new.'
							: 'No spaces allowed. Use hyphens or colons. Press space or comma to add.'
					}
				/>
			)}
		/>
	);
};
