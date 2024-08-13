// Middleware to ensure the user is authenticated.
module.exports = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'You need to log in first');
  res.redirect('/login');
};