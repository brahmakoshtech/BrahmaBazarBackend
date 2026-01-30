import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import connectDB from './config/db.js';

dotenv.config();

const categories = [
    { name: 'Rudraksha', slug: 'rudraksha', description: 'Authentic Rudraksha beads', isActive: true },
    { name: 'Gemstones', slug: 'gemstones', description: 'Precious and semi-precious stones', isActive: true },
    { name: 'Yantra', slug: 'yantra', description: 'Sacred geometric diagrams', isActive: true },
    { name: 'Parad', slug: 'parad', description: 'Mercury items', isActive: true },
    { name: 'Sphatik', slug: 'sphatik', description: 'Crystal quartz items', isActive: true },
    { name: 'Malas', slug: 'malas', description: 'Prayer beads', isActive: true },
    { name: 'Bracelets', slug: 'bracelets', description: 'Spiritual bracelets', isActive: true },
    { name: 'Sale', slug: 'sale', description: 'Discounted items', isActive: true },
];

const seedCategories = async () => {
    try {
        await connectDB();
        await Category.deleteMany({}); // Optional: Clear existing if you want a clean slate, or use upsert

        for (const cat of categories) {
            const exists = await Category.findOne({ slug: cat.slug });
            if (!exists) {
                await Category.create(cat);
                console.log(`Created: ${cat.name}`);
            } else {
                console.log(`Exists: ${cat.name}`);
            }
        }

        console.log('Categories seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();
