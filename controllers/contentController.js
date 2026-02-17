import asyncHandler from 'express-async-handler';
import ContentBlock from '../models/ContentBlock.js';

// @desc    Get all content blocks
// @route   GET /api/content
// @access  Public
const getContentBlocks = asyncHandler(async (req, res) => {
    const { section } = req.query;
    let query = { isActive: true };

    if (section) {
        query.section = section;
    }

    const blocks = await ContentBlock.find(query);

    // transform to object for easier frontend consumption map: { [identifier]: content }
    // But admin might need full array. Let's return array for now which is versatile.
    res.json(blocks);
});

// @desc    Get content blocks by section (Admin/Formatted)
// @route   GET /api/content/admin
// @access  Private/Admin
const getAllContentAdmin = asyncHandler(async (req, res) => {
    const blocks = await ContentBlock.find({});
    res.json(blocks);
});

// @desc    Update a content block
// @route   PUT /api/content/:identifier
// @access  Private/Admin
const updateContentBlock = asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const { content, isActive } = req.body;

    const block = await ContentBlock.findOne({ identifier });

    if (block) {
        block.content = content !== undefined ? content : block.content;
        block.isActive = isActive !== undefined ? isActive : block.isActive;

        const updatedBlock = await block.save();
        res.json(updatedBlock);
    } else {
        res.status(404);
        throw new Error('Content Block not found');
    }
});

// @desc    Seed/Create content block (Internal/Admin use)
// @route   POST /api/content
// @access  Private/Admin
const createContentBlock = asyncHandler(async (req, res) => {
    const { identifier, section, title, content, type } = req.body;

    const blockExists = await ContentBlock.findOne({ identifier });

    if (blockExists) {
        res.status(400);
        throw new Error('Content Block already exists');
    }

    const block = await ContentBlock.create({
        identifier,
        section,
        title,
        content,
        type
    });

    if (block) {
        res.status(201).json(block);
    } else {
        res.status(400);
        throw new Error('Invalid content block data');
    }
});

// @desc    Seed default content blocks
// @route   POST /api/content/seed
// @access  Private/Admin
const seedDefaultContent = asyncHandler(async (req, res) => {
    const defaults = [
        // Navbar
        { identifier: 'navbar_logo_text', section: 'navbar', title: 'Logo Text', content: 'RudraDivine', type: 'text' },
        { identifier: 'navbar_subtitle', section: 'navbar', title: 'Logo Subtitle', content: 'Spiritual Store', type: 'text' },

        // Footer
        { identifier: 'footer_logo_text', section: 'footer', title: 'Footer Logo Text', content: 'RUDRADIVINE', type: 'text' },
        { identifier: 'footer_subtitle', section: 'footer', title: 'Footer Subtitle', content: 'Spiritual Store', type: 'text' },
        { identifier: 'footer_about', section: 'footer', title: 'About Text', content: 'Your trusted companion on the path to spiritual awakening.', type: 'text' },
        { identifier: 'footer_copyright', section: 'footer', title: 'Copyright Text', content: '© 2026 Rudra Divine. With Blessings.', type: 'text' },

        // Contact Info
        { identifier: 'contact_address', section: 'contact', title: 'Store Address', content: 'Varanasi, the City of Light, Uttar Pradesh, India', type: 'text' },
        { identifier: 'contact_phone', section: 'contact', title: 'Phone Number', content: '+91 98765 43210', type: 'text' },
        { identifier: 'contact_email', section: 'contact', title: 'Email Address', content: 'namaste@rudradivine.com', type: 'text' },

        // Social Links
        { identifier: 'social_facebook', section: 'social', title: 'Facebook URL', content: '#', type: 'link' },
        { identifier: 'social_instagram', section: 'social', title: 'Instagram URL', content: '#', type: 'link' },
        { identifier: 'social_twitter', section: 'social', title: 'Twitter URL', content: '#', type: 'link' },
        { identifier: 'social_linkedin', section: 'social', title: 'LinkedIn URL', content: '#', type: 'link' },

        // Home Page - Hero
        { identifier: 'home_hero_label', section: 'home_hero', title: 'Hero Label (Small)', content: 'Rudra Divine Spiritual Store', type: 'text' },
        { identifier: 'home_hero_title', section: 'home_hero', title: 'Hero Title (Main)', content: 'Awaken Your Inner Light', type: 'text' },
        { identifier: 'home_hero_subtitle', section: 'home_hero', title: 'Hero Subtitle', content: 'Begin your sacred journey. Align your energy with the cosmos through authentic spiritual tools.', type: 'text' },
        { identifier: 'home_hero_cta', section: 'home_hero', title: 'Hero Button Text', content: 'Start the Journey', type: 'text' },

        // Home Page - Trust Strip
        { identifier: 'trust_1_title', section: 'home_trust', title: 'Trust 1 Title', content: 'Vedic Authenticity', type: 'text' },
        { identifier: 'trust_1_desc', section: 'home_trust', title: 'Trust 1 Desc', content: 'Energized by Tradition', type: 'text' },
        { identifier: 'trust_2_title', section: 'home_trust', title: 'Trust 2 Title', content: 'Purity Guaranteed', type: 'text' },
        { identifier: 'trust_2_desc', section: 'home_trust', title: 'Trust 2 Desc', content: 'Certified Natural & Real', type: 'text' },
        { identifier: 'trust_3_title', section: 'home_trust', title: 'Trust 3 Title', content: 'Sacred Delivery', type: 'text' },
        { identifier: 'trust_3_desc', section: 'home_trust', title: 'Trust 3 Desc', content: 'Respectfully Shipped', type: 'text' },
        { identifier: 'trust_4_title', section: 'home_trust', title: 'Trust 4 Title', content: 'Trusted Devotion', type: 'text' },
        { identifier: 'trust_4_desc', section: 'home_trust', title: 'Trust 4 Desc', content: 'Serving 50k+ Seekers', type: 'text' },

        // Home Page - Brand Story
        { identifier: 'story_label', section: 'home_story', title: 'Story Label', content: 'The Sacred Origin', type: 'text' },
        { identifier: 'story_title', section: 'home_story', title: 'Story Title', content: 'Timeless Faith. Energized by Devotion.', type: 'text' },
        { identifier: 'story_text_1', section: 'home_story', title: 'Story Paragraph 1', content: 'The journey of the soul requires powerful allies. At Rudra Divine, we do not merely trade in objects; we are custodians of ancient energy. Each Rudraksha, Gemstone, and Yantra is chosen for its vibrational purity.', type: 'text' },
        { identifier: 'story_text_2', section: 'home_story', title: 'Story Paragraph 2', content: 'Our path is one of authenticity. Before reaching your hands, every sacred tool undergoes a rigorous Pran Pratistha ceremony by Vedic Brahmins in Kashi—transforming it from a stone into a living vessel of cosmic power, ready to guide your spiritual evolution.', type: 'text' },
        { identifier: 'story_stat_1_val', section: 'home_story', title: 'Stat 1 Value', content: '12+ Years', type: 'text' },
        { identifier: 'story_stat_1_lbl', section: 'home_story', title: 'Stat 1 Label', content: 'Serving the Dharma', type: 'text' },
        { identifier: 'story_stat_2_val', section: 'home_story', title: 'Stat 2 Value', content: '50,000+', type: 'text' },
        { identifier: 'story_stat_2_lbl', section: 'home_story', title: 'Stat 2 Label', content: 'Seekers Empowered', type: 'text' },

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

    const results = [];
    for (const block of defaults) {
        const exists = await ContentBlock.findOne({ identifier: block.identifier });
        if (!exists) {
            const created = await ContentBlock.create(block);
            results.push(created);
        }
    }

    res.json({ message: `Seeded ${results.length} new content blocks`, created: results });
});

export {
    getContentBlocks,
    getAllContentAdmin,
    updateContentBlock,
    createContentBlock,
    seedDefaultContent
};
