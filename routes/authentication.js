const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");

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
      failureFlash: true
    })(req, res, next);
  });

// Route for displaying the registration page
router.get("/register", (req, res) => {
  res.render("registerPage", {
    errors: []
  });
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

module.exports = router;
