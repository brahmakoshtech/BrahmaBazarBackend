import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Models
import Product from '../models/Product.js';
import Reel from '../models/Reel.js';
import Banner from '../models/Banner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Migration...');
    } catch (error) {
        console.error('Connection Error:', error);
        process.exit(1);
    }
};

const extractKeyFromUrl = (url) => {
    if (!url || !url.startsWith('http')) return url; // Already a key or invalid
    try {
        // Example: https://bucket.s3.region.amazonaws.com/folder/file.jpg
        // We want: folder/file.jpg
        const urlObj = new URL(url);
        // Pathname starts with /, so slice(1) removes it
        return decodeURIComponent(urlObj.pathname.slice(1));
    } catch (e) {
        return url;
    }
};

const migrate = async () => {
    await connectDB();

    console.log('--- Starting Migration: URLs -> Keys ---');

    // 1. MIGRATE PRODUCTS
    const products = await Product.find({});
    let pCount = 0;
    for (const p of products) {
        let modified = false;
        if (p.images && p.images.length > 0) {
            const newImages = p.images.map(img => {
                if (img.startsWith('http')) {
                    modified = true;
                    return extractKeyFromUrl(img);
                }
                return img;
            });
            if (modified) {
                p.images = newImages;
                await p.save();
                pCount++;
            }
        }
    }
    console.log(`✅ Updated ${pCount} Products`);

    // 2. MIGRATE REELS
    const reels = await Reel.find({});
    let rCount = 0;
    for (const r of reels) {
        if (r.videoUrl && r.videoUrl.startsWith('http')) {
            r.videoUrl = extractKeyFromUrl(r.videoUrl);
            await r.save();
            rCount++;
        }
    }
    console.log(`✅ Updated ${rCount} Reels`);

    // 3. MIGRATE BANNERS
    const banners = await Banner.find({});
    let bCount = 0;
    for (const b of banners) {
        if (b.image && b.image.startsWith('http')) {
            b.image = extractKeyFromUrl(b.image);
            await b.save();
            bCount++;
        }
    }
    console.log(`✅ Updated ${bCount} Banners`);

    console.log('--- Migration Complete ---');
    process.exit();
};

migrate();
