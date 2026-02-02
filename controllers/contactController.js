import asyncHandler from 'express-async-handler';
import sendEmail from '../utils/sendEmail.js';
import Contact from '../models/Contact.js';
import Config from '../models/Config.js';

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const sendContactEmail = asyncHandler(async (req, res) => {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !message) {
        res.status(400);
        throw new Error('Please fill in all required fields');
    }

    // 1. Save to Database
    const contact = await Contact.create({
        name,
        email,
        phone,
        subject,
        message
    });

    // 2. Fetch Receiver Email from DB
    let config = await Config.findOne({ key: 'contact_receiver_email' });

    // Fallback if not set in DB
    const receiverEmail = config ? config.value : process.env.SMTP_EMAIL;

    const emailMessage = `
        New Contact Form Submission:

        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        Subject: ${subject || 'General Inquiry'}
        
        Message:
        ${message}
    `;

    try {
        await sendEmail({
            email: receiverEmail,
            subject: `Contact Form: ${subject || 'New Inquiry'} from ${name}`,
            message: emailMessage,
        });

        res.status(200).json({ success: true, message: 'Message sent and saved successfully' });
    } catch (error) {
        console.error("Email send failed:", error);
        // We still return success because the message IS saved in the DB. 
        // We might want to warn the user, but usually, saving it is enough.
        res.status(200).json({ success: true, message: 'Message saved successfully' });
    }
});

// @desc    Get all contact requests
// @route   GET /api/contact
// @access  Private/Admin
const getContacts = asyncHandler(async (req, res) => {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
});

// @desc    Get contact settings (receiver email)
// @route   GET /api/contact/settings
// @access  Private/Admin
const getContactSettings = asyncHandler(async (req, res) => {
    let config = await Config.findOne({ key: 'contact_receiver_email' });
    res.json({
        receiverEmail: config ? config.value : process.env.SMTP_EMAIL
    });
});

// @desc    Update contact settings
// @route   PUT /api/contact/settings
// @access  Private/Admin
const updateContactSettings = asyncHandler(async (req, res) => {
    const { receiverEmail } = req.body;

    if (!receiverEmail) {
        res.status(400);
        throw new Error('Receiver email is required');
    }

    let config = await Config.findOne({ key: 'contact_receiver_email' });

    if (config) {
        config.value = receiverEmail;
        await config.save();
    } else {
        await Config.create({
            key: 'contact_receiver_email',
            value: receiverEmail,
            description: 'Email address where contact form submissions are sent'
        });
    }

    res.json({ success: true, message: 'Receiver email updated', receiverEmail });
});

export {
    sendContactEmail,
    getContacts,
    getContactSettings,
    updateContactSettings
};
