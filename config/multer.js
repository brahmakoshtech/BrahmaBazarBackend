import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Configure Multer S3 Storage
const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        // Organize files into folders: 'products', 'banners', or 'reels'
        let folder = 'uploads';
        if (file.fieldname === 'images' || req.baseUrl.includes('products')) folder = 'products';
        if (file.fieldname === 'image' || req.baseUrl.includes('banners')) folder = 'banners';
        if (file.fieldname === 'video' || req.baseUrl.includes('reels')) folder = 'reels';

        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;

        // Final Path: folder/filename.ext
        cb(null, `${folder}/${fileName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for all uploads
    fileFilter: (req, file, cb) => {
        // Allow images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype === 'video/mp4' || file.mimetype === 'video/webm') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type! Only images and MP4/WebM videos are allowed.'), false);
        }
    }
});

export default upload;
