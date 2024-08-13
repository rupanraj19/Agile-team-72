const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const passportConfig = require('./config/passport');
const bcrypt = require('bcrypt');
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const { scrapeChannelNewsAsia, scrapeMentalHealthFoundation } = require('./scraper');
const chatbotRoutes = require('./routes/chatbot');
const commentRoutes = require('./routes/comments');

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
passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

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
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch CNA articles
    global.db.all(`SELECT * FROM cna_articles WHERE scraped_at > ?`, [oneDayAgo], async (err, cnaArticles) => {
      if (err) {
        console.error("Error fetching CNA articles:", err.message);
        return res.status(500).send("Server Error");
      }

      // If no CNA articles were found, scrape and store new ones
      if (cnaArticles.length === 0) {
        cnaArticles = await scrapeChannelNewsAsia();
        await storeCnaArticlesInDb(cnaArticles);
      }

      // Fetch MHF articles
      global.db.all(`SELECT * FROM mhf_articles WHERE scraped_at > ?`, [oneDayAgo], async (err, mhfArticles) => {
        if (err) {
          console.error("Error fetching MHF articles:", err.message);
          return res.status(500).send("Server Error");
        }

        // If no MHF articles were found, scrape and store new ones
        if (mhfArticles.length === 0) {
          mhfArticles = await scrapeMentalHealthFoundation();
          await storeMhfArticlesInDb(mhfArticles);
        }

        // Fetch comments for both CNA and MHF articles
        global.db.all(`SELECT * FROM comments WHERE article_type = 'cna' OR article_type = 'mhf'`, (err, comments) => {
          if (err) {
            console.error("Error fetching comments:", err.message);
            return res.status(500).send("Server Error");
          }

          // Render the articles page with articles and comments
          res.render('articlesPage', { cnaArticles, mhfArticles, comments });
        });
      });
    });
  } catch (error) {
    console.error('Error scraping articles:', error);
    res.status(500).send('Error scraping articles');
  }
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

app.get("/selftest", (req, res) => {
  res.render("selftest");
})
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
    req.flash("success_msg", "You are logged out");
    res.redirect("/login");
  });
});

const storeCnaArticlesInDb = async (articles) => {
  const insertStmt = `INSERT INTO cna_articles (title, link, category) VALUES (?, ?, ?)`;

  articles.forEach(article => {
      global.db.run(insertStmt, [article.title, article.link, article.category], (err) => {
          if (err) console.error("Error storing CNA article:", err.message);
      });
  });
};

const storeMhfArticlesInDb = async (articles) => {
  const insertStmt = `INSERT INTO mhf_articles (title, link, category, description) VALUES (?, ?, ?, ?)`;

  articles.forEach(article => {
      global.db.run(insertStmt, [article.title, article.link, article.category, article.description], (err) => {
          if (err) console.error("Error storing MHF article:", err.message);
      });
  });
};

// Use comments routes
app.use('/comments', commentRoutes);
app.use('/chatbot', chatbotRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mental Wellbeing Website is running at http://localhost:${PORT}`);
});
