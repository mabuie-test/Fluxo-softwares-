module.exports = function ensureAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.redirectTo = req.originalUrl;
  return res.redirect('/login');
};
