const express = require('express');
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

const router = express.Router();

// Check if email credentials are available
const HAS_EMAIL_CREDENTIALS = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

// Configure email transporter (using Gmail with App Password)
// For Gmail, generate an App Password: https://myaccount.google.com/apppasswords
let transporter = null;

if (HAS_EMAIL_CREDENTIALS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Test email configuration
  transporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️ Email service verification failed:', error.message);
      console.warn('   Emails will be logged but not sent.');
    } else {
      console.log('✓ Email service verified and ready');
    }
  });
} else {
  console.warn('⚠️ EMAIL_USER and EMAIL_PASSWORD not set in environment');
  console.warn('   Emails will be logged but not sent.');
  console.warn('   To enable email: Set EMAIL_USER and EMAIL_PASSWORD in .env file');
  
  // Create fallback transporter that logs instead
  transporter = {
    sendMail: async (options) => {
      console.log('📧 Email (not sent - no credentials):', {
        to: options.to,
        subject: options.subject,
      });
      return { response: 'logged' };
    },
  };
}

/**
 * POST /api/contact/send-email
 * Send contact form email to soilminds100@gmail.com
 * Body: { name, email, message }
 */
router.post('/send-email', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    let emailSent = false;

    try {
      // Email to admin
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'soilminds100@gmail.com',
        to: 'soilminds100@gmail.com',
        subject: `New Contact Form Message from ${name}`,
        html: `
          <h2>New Contact Message</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Sent from Microsence.ai Contact Form</small></p>
        `,
      });

      // Confirmation email to user
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'soilminds100@gmail.com',
        to: email,
        subject: 'We received your message - Microsence.ai',
        html: `
          <h2>Thank you for contacting us!</h2>
          <p>Hi ${name},</p>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>Best regards,<br>Microsence.ai Team</p>
        `,
      });

      emailSent = true;
      console.log(`✓ Email sent from ${name} (${email})`);
    } catch (emailError) {
      console.warn('⚠️ Email sending failed:', emailError.message);
      // Continue anyway - form submission succeeds
      emailSent = false;
    }

    // Store contact in database
    try {
      await prisma.contact.create({
        data: {
          name,
          email,
          message,
          userId: req.body.userId ? parseInt(req.body.userId) : null,
        },
      });
      console.log(`✓ Contact stored: ${name} (${email})`);
    } catch (dbError) {
      console.warn('⚠️ Database storage failed:', dbError.message);
      // Continue anyway - form submission succeeds
    }

    // Return success regardless of email/db status
    res.json({ 
      success: true, 
      message: emailSent ? 'Email sent successfully!' : 'Message received (email service not configured)',
      emailSent 
    });
  } catch (err) {
    console.error('Error in contact endpoint:', err);
    res.status(500).json({ success: false, error: 'Failed to process contact form', details: err.message });
  }
});

/**
 * GET /api/contact/sent-emails
 * Get all sent contact emails for a user
 */
router.get('/sent-emails', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    try {
      const emails = await prisma.contact.findMany({
        where: { userId: parseInt(userId) },
        select: { id: true, name: true, email: true, message: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      res.json({ success: true, emails });
    } catch (dbError) {
      console.warn('⚠️ Failed to fetch contacts from DB:', dbError.message);
      res.json({ success: true, emails: [] });
    }
  } catch (err) {
    console.error('Error fetching sent emails:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch emails' });
  }
});

module.exports = router;
