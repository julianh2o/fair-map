import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadDir = path.join(process.cwd(), 'data', 'uploads');
		// Ensure directory exists
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Generate unique filename with timestamp and random string
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		const ext = path.extname(file.originalname);
		cb(null, `${uniqueSuffix}${ext}`);
	},
});

// File filter to only allow images
// eslint-disable-next-line no-undef
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedExtensions = /jpeg|jpg|png|gif|webp|heic|heif/;
	const allowedMimeTypes = /image\/(jpeg|jpg|png|gif|webp|heic|heif)/;
	const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
	const mimetype = allowedMimeTypes.test(file.mimetype);

	// HEIC files might have mime type 'image/heic', 'image/heif', or sometimes no mime type
	// So we'll be more lenient with HEIC files
	if ((mimetype && extname) || (extname && file.originalname.toLowerCase().match(/\.(heic|heif)$/))) {
		cb(null, true);
	} else {
		cb(new Error('Only image files are allowed'));
	}
};

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: fileFilter,
});

// Upload single image
router.post('/image', upload.single('image') as any, async (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ error: 'No file uploaded' });
			return;
		}

		const filePath = req.file.path;
		const ext = path.extname(req.file.originalname).toLowerCase();

		// Convert HEIC/HEIF to JPEG
		if (ext === '.heic' || ext === '.heif') {
			const jpegFilename = req.file.filename.replace(/\.(heic|heif)$/i, '.jpg');
			const jpegPath = path.join(path.dirname(filePath), jpegFilename);

			try {
				// Read HEIC file
				const inputBuffer = fs.readFileSync(filePath);

				// Convert HEIC to JPEG using heic-convert
				const outputBuffer = await heicConvert({
					buffer: inputBuffer,
					format: 'JPEG',
					quality: 0.85,
				});

				// Write JPEG file using sharp for additional optimization
				// eslint-disable-next-line no-undef
				await sharp(outputBuffer as Buffer)
					.jpeg({ quality: 85 })
					.toFile(jpegPath);

				// Delete original HEIC file
				fs.unlinkSync(filePath);

				// Return JPEG URL
				const fileUrl = `/uploads/${jpegFilename}`;
				res.json({ url: fileUrl });
			} catch (conversionError) {
				console.error('Error converting HEIC to JPEG:', conversionError);
				// Clean up files
				if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
				if (fs.existsSync(jpegPath)) fs.unlinkSync(jpegPath);
				res.status(500).json({ error: 'Failed to convert image' });
			}
		} else {
			// Return the file URL for other formats
			const fileUrl = `/uploads/${req.file.filename}`;
			res.json({ url: fileUrl });
		}
	} catch (error) {
		console.error('Error uploading image:', error);
		res.status(500).json({ error: 'Failed to upload image' });
	}
});

// Upload multiple images
router.post('/images', upload.array('images', 50) as any, async (req: Request, res: Response) => {
	try {
		if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
			res.status(400).json({ error: 'No files uploaded' });
			return;
		}

		// Process all files, converting HEIC to JPEG if needed
		const fileUrls = await Promise.all(
			req.files.map(async (file) => {
				const filePath = file.path;
				const ext = path.extname(file.originalname).toLowerCase();

				// Convert HEIC/HEIF to JPEG
				if (ext === '.heic' || ext === '.heif') {
					const jpegFilename = file.filename.replace(/\.(heic|heif)$/i, '.jpg');
					const jpegPath = path.join(path.dirname(filePath), jpegFilename);

					try {
						// Read HEIC file
						const inputBuffer = fs.readFileSync(filePath);

						// Convert HEIC to JPEG using heic-convert
						const outputBuffer = await heicConvert({
							buffer: inputBuffer,
							format: 'JPEG',
							quality: 0.85,
						});

						// Write JPEG file using sharp for additional optimization
						// eslint-disable-next-line no-undef
						await sharp(outputBuffer as Buffer)
							.jpeg({ quality: 85 })
							.toFile(jpegPath);

						// Delete original HEIC file
						fs.unlinkSync(filePath);

						return `/uploads/${jpegFilename}`;
					} catch (conversionError) {
						console.error('Error converting HEIC to JPEG:', conversionError);
						// Clean up files
						if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
						if (fs.existsSync(jpegPath)) fs.unlinkSync(jpegPath);
						// Return null for failed conversions
						return null;
					}
				} else {
					return `/uploads/${file.filename}`;
				}
			}),
		);

		// Filter out any null values from failed conversions
		const successfulUrls = fileUrls.filter((url) => url !== null) as string[];

		res.json({ urls: successfulUrls });
	} catch (error) {
		console.error('Error uploading images:', error);
		res.status(500).json({ error: 'Failed to upload images' });
	}
});

export default router;
