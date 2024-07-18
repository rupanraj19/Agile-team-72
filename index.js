const express = require('express');
const path = require('path');
const app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files such as logo images
app.use(express.static(path.join(__dirname, 'public')));

// Define routes for each page
app.get('/', (req, res) => {
    res.render('homePage');
});

app.get('/articles', (req, res) => {
    res.render('articlesPage');
});

app.get('/program', (req, res) => {
    res.render('programPage');
});

app.get('/programGames', (req, res) => {
    res.render('programGamesPage');
});

app.get('/about', (req, res) => {
    res.render('aboutPage');
});

app.get('/contact', (req, res) => {
    res.render('contactPage');
});

app.get('/login', (req, res) => {
    res.render('loginPage');
});

app.get('/register', (req, res) => {
    res.render('registerPage');
});

app.get('/aboutMentalHealth', (req, res) => {
    res.render('aboutMentalHealth');
});

app.get('/faq', (req, res) => {
    res.render('faq');
});

app.get('/privacyPolicy', (req, res) => {
    res.render('privacyPolicy');
});

app.get('/termsOfUse', (req, res) => {
    res.render('termsOfUse');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
