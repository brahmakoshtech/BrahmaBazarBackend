import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ContentBlock from '../models/ContentBlock.js';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedContent = async () => {
    try {
        await connectDB();

        const defaults = [
            // Home Page - Trending Section
            { identifier: 'trending_label', section: 'home_trending', title: 'Trending Label', content: 'Curated Favorites', type: 'text' },
            { identifier: 'trending_title', section: 'home_trending', title: 'Trending Title', content: 'Trending', type: 'text' },
            { identifier: 'trending_title_accent', section: 'home_trending', title: 'Trending Title Accent', content: 'Now', type: 'text' },
            { identifier: 'trending_cta', section: 'home_trending', title: 'Trending CTA Button', content: 'View All Trending', type: 'text' },

            // Home Page - New Arrivals Section
            { identifier: 'arrivals_label', section: 'home_arrivals', title: 'Arrivals Label', content: 'Latest Treasures', type: 'text' },
            { identifier: 'arrivals_title', section: 'home_arrivals', title: 'Arrivals Title', content: 'New', type: 'text' },
            { identifier: 'arrivals_title_accent', section: 'home_arrivals', title: 'Arrivals Title Accent', content: 'Arrivals', type: 'text' },
            { identifier: 'arrivals_cta', section: 'home_arrivals', title: 'Arrivals CTA Button', content: 'See All Collection', type: 'text' },

            // Home Page - Reels Section
            { identifier: 'reels_label', section: 'home_reels', title: 'Reels Label', content: 'Visual Stories', type: 'text' },
            { identifier: 'reels_title', section: 'home_reels', title: 'Reels Title', content: 'Sacred', type: 'text' },
            { identifier: 'reels_title_accent', section: 'home_reels', title: 'Reels Title Accent', content: 'Reels', type: 'text' },
            { identifier: 'reels_subtitle', section: 'home_reels', title: 'Reels Subtitle', content: 'Immerse yourself in the divine energy through our curated visual journeys.', type: 'text' },

            // For You Page - Header
            { identifier: 'foryou_title', section: 'for_you', title: 'For You Title', content: 'Your Personalized Collections', type: 'text' },
            { identifier: 'foryou_subtitle', section: 'for_you', title: 'For You Subtitle', content: 'Sacred recommendations crafted just for you', type: 'text' },
            { identifier: 'must_have_title', section: 'for_you', title: 'Must Have Section Title', content: 'Must Have', type: 'text' },
            { identifier: 'good_to_have_title', section: 'for_you', title: 'Good to Have Section Title', content: 'Good To Have', type: 'text' },

            // For You - Subtitles for different types
            { identifier: 'subtitle_shop_good', section: 'for_you_subtitles', title: 'Shop - Good Subtitle', content: 'Helps maintain calm and balance', type: 'text' },
            { identifier: 'subtitle_shop_must', section: 'for_you_subtitles', title: 'Shop - Must Subtitle', content: 'Strengthens your energy', type: 'text' },
            { identifier: 'subtitle_seva_good', section: 'for_you_subtitles', title: 'Seva - Good Subtitle', content: 'Small sacred steps for harmony', type: 'text' },
            { identifier: 'subtitle_seva_must', section: 'for_you_subtitles', title: 'Seva - Must Subtitle', content: 'Core spiritual alignment', type: 'text' },
            { identifier: 'subtitle_yatra_good', section: 'for_you_subtitles', title: 'Yatra - Good Subtitle', content: 'Helpful companions for your journey', type: 'text' },
            { identifier: 'subtitle_yatra_must', section: 'for_you_subtitles', title: 'Yatra - Must Subtitle', content: 'Essential protection for travel', type: 'text' },
            { identifier: 'subtitle_puja_good', section: 'for_you_subtitles', title: 'Puja - Good Subtitle', content: 'Enhances your ritual gently', type: 'text' },
            { identifier: 'subtitle_puja_must', section: 'for_you_subtitles', title: 'Puja - Must Subtitle', content: 'Completes your sacred ritual', type: 'text' },
            { identifier: 'subtitle_default_good', section: 'for_you_subtitles', title: 'Default - Good Subtitle', content: 'Recommended for spiritual balance', type: 'text' },
            { identifier: 'subtitle_default_must', section: 'for_you_subtitles', title: 'Default - Must Subtitle', content: 'Essential for your well-being', type: 'text' },
        ];

        let created = 0;
        let skipped = 0;

        for (const block of defaults) {
            const exists = await ContentBlock.findOne({ identifier: block.identifier });
            if (!exists) {
                await ContentBlock.create(block);
                created++;
                console.log(`✅ Created: ${block.identifier}`);
            } else {
                skipped++;
                console.log(`⏭️  Skipped (exists): ${block.identifier}`);
            }
        }

        console.log(`\n✅ Seeding complete!`);
        console.log(`   Created: ${created} blocks`);
        console.log(`   Skipped: ${skipped} blocks`);
        console.log(`   Total: ${defaults.length} blocks`);

        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedContent();
