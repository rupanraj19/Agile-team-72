const express = require('express');
const router = express.Router();

// Add a comment to an article
router.post('/add-comment', (req, res) => {
    const { articleId, articleType, comment } = req.body;
    const userId = req.user ? req.user.user_id : null; // Ensure user is logged in

    if (!userId) {
        // Redirect to login page with a flash message
        req.flash('error', 'You need to be logged in to comment.');
        return res.redirect('/login');
    }

    // Insert the comment into the database
    global.db.run(
        `INSERT INTO comments (article_id, article_type, user_id, comment) VALUES (?, ?, ?, ?)`,
        [articleId, articleType, userId, comment],
        function (err) {
            if (err) {
                console.error("Error inserting comment:", err.message);
                return res.status(500).send("Server Error");
            }
            console.log("testing")
            // Redirect back to the articles page after successful comment submission
            res.redirect('/articles');
        }
    );
});

module.exports = router;
