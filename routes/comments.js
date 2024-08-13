const express = require('express');
const router = express.Router();

// Add a comment to an article
router.post('/add-comment', (req, res) => {
    const { articleId, articleType, comment } = req.body;
    const userId = req.user ? req.user.user_id : null; // Ensure user is logged in

    if (!userId) {
        return res.status(403).send("User not authenticated");
    }

    // Insert the comment into the database
    global.db.run(
        `INSERT INTO comments (article_id, article_type, user_id, comment) VALUES (?, ?, ?, ?)`,
        [articleId, articleType, userId, comment],
        (err) => {
            if (err) {
                console.error("Error inserting comment:", err.message);
                return res.status(500).send("Server Error");
            }
            // Redirect to the articles page
            res.redirect('/articles');
        }
    );
});

module.exports = router;
