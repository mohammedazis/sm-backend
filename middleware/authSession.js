const authenticateSession = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.name) {
    // User is authenticated
    console.log('Authenticated user:', req.session.user.name.toString());
    req.user = req.session.user; // Attach the session user to the request object
    return next();
  } else {
    // User is not authenticated, send 401 Unauthorized
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
};

module.exports = authenticateSession;
