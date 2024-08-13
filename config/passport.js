const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

module.exports = function(passport) {
  // Setting up the local strategy for username-password authentication
  passport.use(new LocalStrategy(
    function(username, password, done) {
      const query = "SELECT * FROM users WHERE user_name = ?";
      db.get(query, [username], (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'No user with that username' });

        // Compare the hashed password from the database with the password input by the user
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) return done(err);
          if (isMatch) return done(null, user);
          else return done(null, false, { message: 'Password incorrect' });
        });
      });
    }
  ));

  // Serialize user instance to the session
  passport.serializeUser(function(user, done) {
    done(null, user.user_id); // Ensure 'user.user_id' matches your user ID column name
  });

  // Deserialize user instance from the session
  passport.deserializeUser(function(id, done) {
    const query = "SELECT * FROM users WHERE user_id = ?";
    db.get(query, [id], (err, user) => {
      done(err, user);
    });
  });
};
