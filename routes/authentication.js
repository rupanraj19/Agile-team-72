const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Route for displaying the login page
router.get("/login", (req, res) => {
  res.render("loginPage", {
    errors: req.flash("error"),
  });
});

// Route for handling login POST request using Passport.js
router.post("/login", (req, res, next) => {
  req.session.user_id = user.user_id; // Store the user ID in the session
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })(req, res, next);
});

// Route for handling registration POST request
router.post("/register", (req, res) => {
  const { username, email, password, password2 } = req.body;
  let errors = [];

  // Validation checks
  if (!username || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    return res.render("registerPage", { errors });
  }

  // Check if username or email already exists
  db.get("SELECT * FROM users WHERE user_name = ? OR email = ?", [username, email], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server Error");
    }

    if (user) {
      errors.push({ msg: "Username or email already exists" });
      return res.render("registerPage", { errors });
    }

    // Hash the password and save the user to the database
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        const insertQuery = "INSERT INTO users (user_name, email, password) VALUES (?, ?, ?)";
        db.run(insertQuery, [username, email, hash], (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Server Error");
          }
          req.flash("success_msg", "You are now registered and can log in");
          res.redirect("/auth/login");
        });
      });
    });
  });
});

// Route for handling logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "You are logged out");
    res.redirect("/auth/login");
  });
});

// Route to display the forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgotPasswordPage", { errors: [] });
});

// Route to handle the forgot password form submission
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  let errors = [];

  if (!email) {
    errors.push("Please enter your email.");
  }

  if (errors.length > 0) {
    return res.render("forgotPasswordPage", { errors });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

  // Check if email exists
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server Error");
    }
    if (!user) {
      errors.push("No account with that email address exists.");
      return res.render("forgotPasswordPage", { errors });
    }

    // Store reset token and expiry in the database
    db.run("UPDATE users SET reset_token = ?, token_expiry = ? WHERE email = ?", [resetToken, tokenExpiry, email], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }

      // Send reset email
      const resetLink = `http://localhost:3000/auth/reset-password/${resetToken}`;
      sendResetEmail(email, resetLink);

      req.flash("success_msg", "Password reset link sent to your email.");
      res.redirect("/auth/login");
    });
  });
});

// Route to display the reset password form
router.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;
  db.get("SELECT * FROM users WHERE reset_token = ? AND token_expiry > ?", [token, Date.now()], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server Error");
    }
    if (!user) {
      req.flash("error", "Invalid or expired token.");
      return res.redirect("/auth/login");
    }
    // Pass the token and an empty errors array to the EJS view
    res.render("resetPasswordPage", { token, errors: [] });
  });
});


// Route to handle password reset
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    req.flash("error", "Passwords do not match.");
    return res.redirect(`/auth/reset-password/${token}`);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run("UPDATE users SET password = ?, reset_token = NULL, token_expiry = NULL WHERE reset_token = ? AND token_expiry > ?", [hashedPassword, token, Date.now()], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }
      req.flash("success_msg", "Password has been reset.");
      res.redirect("/auth/login");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Function to send reset email
const sendResetEmail = (email, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: 'aspteam72@outlook.com',
      pass: 'password000.'
    }
  });

  const mailOptions = {
    from: 'aspteam72@outlook.com',
    to: email,
    subject: 'Password Reset',
    text: `You requested a password reset. Click the following link to reset your password: ${resetLink}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};


// contact form

router.get('/contact', (req, res) => {
  res.render("contactPage")
})



// Handle the form submission (in your route handler)
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Create a transporter object using your email service
  const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: 'aspteam72@outlook.com',
      pass: 'password000.'
    }
  });

  // Email to you
  const mailToYou = {
    from: email, // User's email
    to: 'aspteam72@outlook.com', // Your personal email
    subject: `New Contact Form Submission from ${name}`,
    text: `You have a new message from ${name} (${email}):\n\n${message}`
  };

  // Send the email to you
  transporter.sendMail(mailToYou, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error sending email');
    }

    // After sending the email to you, send an auto-reply to the user
    const autoReply = {
      from: 'aspteam72@outlook.com', // Your email
      to: email, // User's email
      subject: 'Thank you for contacting us!',
      text: `Dear ${name},\n\nThank you for your message. We will get back to you shortly.\n\nBest regards,\nYour Team`,

    };

    // transporter.sendMail(autoReply, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //     return res.status(500).send('Error sending auto-reply email');
    //   }

    //   res.status(200).send('Your message has been sent successfully');
    // });
  });
});


module.exports = router;
