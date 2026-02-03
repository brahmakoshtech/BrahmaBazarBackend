import Faq from '../models/Faq.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all active FAQs (Public)
// @route   GET /api/faqs
// @access  Public
const getPublicFaqs = asyncHandler(async (req, res) => {
    const faqs = await Faq.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(faqs);
});

// @desc    Get all active FAQs (Admin)
// @route   GET /api/admin/faqs
// @access  Private/Admin
const getAllFaqs = asyncHandler(async (req, res) => {
    const faqs = await Faq.find({}).sort({ createdAt: -1 });
    res.json(faqs);
});


// @desc    Create a new FAQ
// @route   POST /api/admin/faqs
// @access  Private/Admin
const createFaq = asyncHandler(async (req, res) => {
    const { question, answer, isActive } = req.body;

    const faq = new Faq({
        question,
        answer,
        isActive: isActive !== undefined ? isActive : true,
    });

    const createdFaq = await faq.save();
    res.status(201).json(createdFaq);
});

// @desc    Update a FAQ
// @route   PUT /api/admin/faqs/:id
// @access  Private/Admin
const updateFaq = asyncHandler(async (req, res) => {
    const { question, answer, isActive } = req.body;

    const faq = await Faq.findById(req.params.id);

    if (faq) {
        faq.question = question || faq.question;
        faq.answer = answer || faq.answer;
        if (isActive !== undefined) {
            faq.isActive = isActive;
        }

        const updatedFaq = await faq.save();
        res.json(updatedFaq);
    } else {
        res.status(404);
        throw new Error('FAQ not found');
    }
});

// @desc    Delete a FAQ
// @route   DELETE /api/admin/faqs/:id
// @access  Private/Admin
const deleteFaq = asyncHandler(async (req, res) => {
    const faq = await Faq.findById(req.params.id);

    if (faq) {
        await faq.deleteOne();
        res.json({ message: 'FAQ removed' });
    } else {
        res.status(404);
        throw new Error('FAQ not found');
    }
});

// @desc    Seed default FAQs
// @route   POST /api/admin/faqs/seed
// @access  Private/Admin (or Public for initial setup if protected elsewhere)
const seedFaqs = asyncHandler(async (req, res) => {
    await Faq.deleteMany({});

    const defaultFaqs = [
        {
            question: "Are your Rudraksha products authentic?",
            answer: "Yes, all our Rudraksha beads are 100% authentic and sourced directly from trusted origins in Nepal and Indonesia. Each bead undergoes a strict quality check before being offered to you."
        },
        {
            question: "How long does delivery take?",
            answer: "Delivery typically takes 5-7 business days within India. For international orders, it may take 10-15 business days depending on the destination and customs clearance."
        },
        {
            question: "Do you provide energised/spiritually blessed items?",
            answer: "Yes, we believe in the sanctity of our products. All item are energized with Vedic mantras and rituals by experienced pandits before dispatch to ensure they carry positive vibrations."
        },
        {
            question: "Can I return or exchange products?",
            answer: "We have a customer-friendly return policy. If you receive a damaged or incorrect item, please report it within 48 hours of delivery for a replacement or deeper review. Please check our detailed Return Policy page for more specifics."
        },
        {
            question: "What payment methods are accepted?",
            answer: "We accept a wide range of payment methods including Credit/Debit Cards, Net Banking, UPI, and major digital wallets. Secure payments are processed via our trusted payment gateway partners."
        }
    ];

    const createdFaqs = await Faq.insertMany(defaultFaqs);
    res.status(201).json(createdFaqs);
});

export {
    getPublicFaqs,
    getAllFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
    seedFaqs
};
