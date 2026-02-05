import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from '../models/Banner.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fixBanners = async () => {
    await connectDB();
    try {
        const result = await Banner.updateMany(
            { link: "Gemstones" },
            { $set: { link: "/category/gemstones" } }
        );
        console.log('Fixed Banners:', result);

        // Also check for "Bracelets" if it should be lowercase
        // But /category/Bracelets might be valid if slug is capitalized. 
        // Best practice is lowercase slugs.
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

fixBanners();
