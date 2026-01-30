import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import connectDB from './config/db.js';

dotenv.config();

const products = [
    {
        title: '5 Mukhi Rudraksha',
        description: 'Authentic 5 Mukhi Rudraksha for peace and health. Sourced from Nepal.',
        price: 499,
        category: 'Rudraksha',
        stock: 50,
        images: ['https://images.unsplash.com/photo-1620021665471-ca0afcb10243?w=800&q=80']
    },
    {
        title: 'Gauri Shankar Rudraksha',
        description: 'Rare Gauri Shankar Rudraksha for harmonizing relationships.',
        price: 2500,
        category: 'Rudraksha',
        stock: 10,
        images: ['https://images.unsplash.com/photo-1615485925763-8678628890da?w=800&q=80']
    },
    {
        title: 'Amethyst Healing Crystal',
        description: 'Natural Amethyst stone for spiritual protection and clarity.',
        price: 1200,
        category: 'Gemstones',
        stock: 20,
        images: ['https://images.unsplash.com/photo-1632516167262-e1a49e6d0a7a?w=800&q=80']
    },
    {
        title: 'Sri Yantra',
        description: 'Powerful Sri Yantra made of copper for abundance and prosperity.',
        price: 899,
        category: 'Yantra',
        stock: 15,
        images: ['https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800&q=80']
    },
    {
        title: 'Parad Shivling',
        description: 'Pure Mercury (Parad) Shivling for intense meditation and blessings.',
        price: 3500,
        category: 'Parad',
        stock: 5,
        images: ['https://images.unsplash.com/photo-1596765759160-5f25712e1281?w=800&q=80']
    },
    {
        title: 'Sphatik Mala',
        description: 'Crystal Quartz (Sphatik) Mala for cooling the mind and body.',
        price: 750,
        category: 'Sphatik',
        stock: 30,
        images: ['https://images.unsplash.com/photo-1601633512211-13c5ee935d28?w=800&q=80']
    }
];

const seedProducts = async () => {
    try {
        await connectDB();

        // Check if products exist to avoid duplicate seeding
        for (const p of products) {
            const exists = await Product.findOne({ title: p.title });
            if (!exists) {
                await Product.create(p);
                console.log(`Created product: ${p.title}`);
            } else {
                console.log(`Product already exists: ${p.title}`);
            }
        }

        console.log('Product seeding completed!');
        process.exit();
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
