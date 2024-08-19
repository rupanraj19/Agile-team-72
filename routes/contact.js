const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Contact form route
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: 'aspteam72@outlook.com',
          pass: 'password000.'
        }
    });

    // Set up mail options
    const mailOptions = {
      from: 'aspteam72@outlook.com',
      to: 'aspteam72@outlook.com', // Your email to receive messages
      subject: 'Contact Us',
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Redirect to success page
    res.redirect('/success');
  } catch (err) {
    console.error("Failed to send the message:", err.message);
    req.flash('error', 'Something went wrong. Please try again later.');
    res.redirect("/contact");
  }
});

module.exports = router;
