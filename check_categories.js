import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';

dotenv.config();

const checkCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const categories = await Category.find({});
        console.log(`Found ${categories.length} categories.`);
        categories.forEach(c => console.log(`- ${c.name} (Slug: ${c.slug}, Active: ${c.isActive})`));

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkCategories();
