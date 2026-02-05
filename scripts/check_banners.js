import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from '../models/Banner.js';
import path from 'path';
import fs from 'fs';
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

const checkBanners = async () => {
    await connectDB();
    try {
        const banners = await Banner.find({});
        let output = '--- ALL BANNERS ---\n';
        banners.forEach(b => {
            output += `Title: "${b.title}" | Link: "${b.link}" | Position: ${b.position}\n`;
        });
        output += '-------------------\n';
        fs.writeFileSync('banners_dump.txt', output);
        console.log('Dumped to banners_dump.txt');
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

checkBanners();
