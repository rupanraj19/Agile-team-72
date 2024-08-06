const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const { scrapeChannelNewsAsia, scrapeMentalHealthFoundation } = require('./scraper');

const app = express();

// Session and Flash setup
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Database setup
global.db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
  console.log("Database connected");
  global.db.run("PRAGMA foreign_keys=ON");
});

// Global settings
global.userToken = crypto.randomUUID();
global.settings = {};

// Set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files such as logo images
app.use(express.static(path.join(__dirname, "public")));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Passport local strategy setup
passport.use(new LocalStrategy(
  async (username, password, done) => {
    global.db.get('SELECT * FROM users WHERE user_name = ?', [username], async (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Incorrect username.' });

      const match = await bcrypt.compare(password, user.password);
      if (match) return done(null, user);
      else return done(null, false, { message: 'Incorrect password.' });
    });
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

// Deserialize user
passport.deserializeUser((id, done) => {
  global.db.get('SELECT * FROM users WHERE user_id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// Define routes for each page
app.get("/", (req, res) => {
  res.render("homePage", { user: req.user });
});

app.get('/articles', async (req, res) => {
  try {
    const [cnaArticles, mhfArticles] = await Promise.all([
      scrapeChannelNewsAsia(),
      scrapeMentalHealthFoundation()
    ]);

    res.render('articlesPage', { cnaArticles, mhfArticles });
  } catch (error) {
    console.error('Error scraping articles:', error);
    res.status(500).send('Error scraping articles');
  }
});

app.get("/readArticle/:id", (req, res) => {
  const { id } = req.params;
  global.db.get("SELECT * FROM articles WHERE article_id = ?", [id], (err, article) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server Error");
    }
    res.render("readArticle", { article });
  });
});

app.get("/program", (req, res) => {
  res.render("programPage");
});

app.get("/programGames", (req, res) => {
  res.render("programGamesPage");
});

app.get("/about", (req, res) => {
  res.render("aboutPage");
});

app.get("/contact", (req, res) => {
  res.render("contactPage");
});

app.get("/login", (req, res) => {
  res.render("loginPage", { errors: req.flash("error") });
});

app.get("/register", (req, res) => {
  res.render("registerPage", { errors: [] });
});

app.get("/games", (req, res) => {
  res.render("programGamesPage");
});

app.get("/aboutMentalHealth", (req, res) => {
  res.render("aboutMentalHealth");
});

app.get("/faq", (req, res) => {
  res.render("faq");
});

app.get("/privacyPolicy", (req, res) => {
  res.render("privacyPolicy");
});

app.get("/termsOfUse", (req, res) => {
  res.render("termsOfUse");
});

// Register route
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    global.db.run(
      `INSERT INTO users (user_name, password, email) VALUES (?, ?, ?)`,
      [username, hashedPassword, email],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send("Server Error");
        }
        // Redirect or provide feedback
        res.redirect("/login");
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Login route
app.post("/login", passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server Error");
    }
    res.redirect('/');
  });
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mental Wellbeing Website is running at http://localhost:${PORT}`);
});
