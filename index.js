const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const passportConfig = require("./config/passport");
const { scrapeChannelNewsAsia, scrapeMentalHealthFoundation } = require('./scraper');
const chatbotRoutes = require("./routes/chatbot");
const commentRoutes = require("./routes/comments");
const authRoutes = require("./routes/authentication");
const contactRoutes = require("./routes/contact");

const app = express();

// Global settings
global.userToken = crypto.randomUUID();
global.settings = {};

// Database setup
global.db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
  console.log("Database connected");
  global.db.run("PRAGMA foreign_keys=ON");
});

// Session and middleware setup
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

passportConfig(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// View engine and static files setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Passport local strategy setup
passport.use(
  new LocalStrategy(async (username, password, done) => {
    global.db.get(
      "SELECT * FROM users WHERE user_name = ?",
      [username],
      async (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, { message: "Incorrect username." });

        const match = await bcrypt.compare(password, user.password);
        return match
          ? done(null, user)
          : done(null, false, { message: "Incorrect password." });
      }
    );
  })
);
passport.serializeUser((user, done) => done(null, user.user_id));
passport.deserializeUser((id, done) => {
  global.db.get("SELECT * FROM users WHERE user_id = ?", [id], (err, user) =>
    done(err, user)
  );
});

// Function to fetch and store articles
async function fetchAndStoreArticles(
  scrapeFunction,
  tableName,
  insertQuery,
  oneDayAgo
) {
  return new Promise((resolve, reject) => {
    global.db.all(
      `SELECT * FROM ${tableName} WHERE scraped_at > ?`,
      [oneDayAgo],
      async (err, articles) => {
        if (err) return reject(err);

        if (articles.length === 0) {
          articles = await scrapeFunction();
          articles.forEach((article) => {
            global.db.run(insertQuery, Object.values(article), (err) => {
              if (err)
                console.error(
                  `Error storing ${tableName} article:`,
                  err.message
                );
            });
          });
        }
        resolve(articles);
      }
    );
  });
}

// Routes
app.get("/", (req, res) =>
  res.render("homePage", { user: req.user, currentPath: req.path })
);

app.get("/articles", async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch CNA articles
    const cnaArticles = await fetchAndStoreArticles(
      scrapeChannelNewsAsia,
      "cna_articles",
      "INSERT INTO cna_articles (title, link, category) VALUES (?, ?, ?)",
      oneDayAgo
    );

    // Fetch MHF articles
    const mhfArticles = await fetchAndStoreArticles(
      scrapeMentalHealthFoundation,
      "mhf_articles",
      "INSERT INTO mhf_articles (title, link, category, description) VALUES (?, ?, ?, ?)",
      oneDayAgo
    );

    // Fetch comments for the articles
    global.db.all(
      `
      SELECT comments.*, users.user_name
      FROM comments
      LEFT JOIN users ON comments.user_id = users.user_id
      WHERE comments.article_type = 'cna' OR comments.article_type = 'mhf'
    `,
      (err, comments) => {
        if (err) return res.status(500).send("Server Error");

        // Render the articles page with fetched articles and comments
        res.render("articlesPage", {
          user: req.user,
          currentPath: req.path,
          comments,
          cnaArticles, // Pass CNA articles
          mhfArticles, // Pass MHF articles
        });
      }
    );
  } catch (error) {
    console.error("Error scraping articles:", error);
    res.status(500).send("Error scraping articles");
  }
});

// Reused routes for multiple views (excluding login)
const staticRoutes = [
  { path: "/program", view: "programPage" },
  { path: "/programGames", view: "programGamesPage" },
  { path: "/about", view: "aboutPage" },
  { path: "/contact", view: "contactPage" },
  { path: "/register", view: "registerPage", options: { errors: [] } },
  { path: "/games", view: "programGamesPage" },
  { path: "/aboutMentalHealth", view: "aboutMentalHealth" },
  { path: "/faq", view: "faq" },
  { path: "/privacyPolicy", view: "privacyPolicy" },
  { path: "/termsOfUse", view: "termsOfUse" },
  { path: "/selftest", view: "selftest" },
];

staticRoutes.forEach(({ path, view, options = {} }) => {
  app.get(path, (req, res) =>
    res.render(view, { user: req.user, currentPath: req.path, ...options })
  );
});

// Separate route for login (with flash messages)
app.get("/login", (req, res) =>
  res.render("loginPage", { user: req.user, currentPath: req.path, errors: req.flash("error") })
);

// Register route
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    global.db.run(
      `INSERT INTO users (user_name, password, email) VALUES (?, ?, ?)`,
      [username, hashedPassword, email],
      (err) => {
        if (err) return res.status(500).send("Server Error");
        res.redirect("/login");
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Login route
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Logout route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Server Error");
    req.flash("success_msg", "You are logged out");
    res.redirect("/login");
  });
});

// Article-specific routes
const articleRoutes = [
  { path: "/bipolar", view: "articles/bipolar" },
  { path: "/schizo", view: "articles/schizo" },
  { path: "/ptsd", view: "articles/ptsd" },
  { path: "/anxiety", view: "articles/anxiety" },
  { path: "/personality", view: "articles/personality" },
];

articleRoutes.forEach(({ path, view }) => {
  app.get(path, (req, res) => res.render(view, { currentPath: req.path }));
});

// Custom routes
app.use("/comments", commentRoutes);
app.use("/chatbot", chatbotRoutes);
app.use("/auth", authRoutes);
app.use("/contact", contactRoutes);

app.get("/success", (req, res) => res.render("success"));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(
    `Mental Wellbeing Website is running at http://localhost:${PORT}`
  );
});
