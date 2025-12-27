import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
	const allowedTypes = /jpeg|jpg|png|gif|webp/;
	const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = allowedTypes.test(file.mimetype);

	if (mimetype && extname) {
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
router.post('/image', upload.single('image') as any, (req: Request, res: Response) => {
	try {
		if (!req.file) {
			res.status(400).json({ error: 'No file uploaded' });
			return;
		}

		// Return the file URL
		const fileUrl = `/uploads/${req.file.filename}`;
		res.json({ url: fileUrl });
	} catch (error) {
		console.error('Error uploading image:', error);
		res.status(500).json({ error: 'Failed to upload image' });
	}
});

// Upload multiple images
router.post('/images', upload.array('images', 50) as any, (req: Request, res: Response) => {
	try {
		if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
			res.status(400).json({ error: 'No files uploaded' });
			return;
		}

		// Return array of file URLs
		const fileUrls = req.files.map((file) => `/uploads/${file.filename}`);
		res.json({ urls: fileUrls });
	} catch (error) {
		console.error('Error uploading images:', error);
		res.status(500).json({ error: 'Failed to upload images' });
	}
});

export default router;
