import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import ContentBlock from '../models/ContentBlock.js';

dotenv.config({ path: '../.env' }); // Adjust path if needed, usually running from backend root

const contentData = [
    // Navbar
    {
        identifier: 'navbar_announcement_left',
        section: 'navbar',
        title: 'Announcement Left Text',
        content: 'Awaken Your Inner Energy',
        type: 'text'
    },
    {
        identifier: 'navbar_announcement_right',
        section: 'navbar',
        title: 'Announcement Right Text',
        content: 'Authentic Vedic Tools',
        type: 'text'
    },
    {
        identifier: 'navbar_promo',
        section: 'navbar',
        title: 'Promo Center Text',
        content: 'Start Your Sacred Journey • Free Shipping on Orders over ₹999',
        type: 'text'
    },
    {
        identifier: 'navbar_phone',
        section: 'navbar',
        title: 'Support Phone Number',
        content: '+91-99999*****',
        type: 'text'
    },

    // Home Hero
    {
        identifier: 'home_hero_title',
        section: 'home_hero',
        title: 'Hero Main Title',
        content: 'Discover Your Spiritual Path',
        type: 'text'
    },
    {
        identifier: 'home_hero_subtitle',
        section: 'home_hero',
        title: 'Hero Subtitle',
        content: 'Authentic Rudraksha, Gemstones & Yantras',
        type: 'text'
    },

    // Footer
    {
        identifier: 'footer_about',
        section: 'footer',
        title: 'Footer About Text',
        content: 'RudraDivine is your trusted source for authentic spiritual tools. We are dedicated to providing high-quality, energized products to support your spiritual journey.',
        type: 'text'
    },
    {
        identifier: 'footer_copyright',
        section: 'footer',
        title: 'Copyright Text',
        content: '© 2026 RudraDivine. All rights reserved.',
        type: 'text'
    }
];

const seedContent = async () => {
    try {
        await connectDB();

        // Check if content already exists to avoid overwriting edits
        const count = await ContentBlock.countDocuments();
        if (count > 0) {
            console.log('Content Blocks already exist. Skipping seed.');
            process.exit();
        }

        await ContentBlock.deleteMany(); // Optional: clear if you want fresh start always

        await ContentBlock.insertMany(contentData);

        console.log('Content Blocks Seeded!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedContent();
