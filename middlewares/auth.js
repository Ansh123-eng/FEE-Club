const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Ensure JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

const protect = async (req, res, next) => {
  let token;

  try {
    // Check for token in cookies, headers, or query params
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Token from cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).redirect('/?error=unauthorized');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).redirect('/?error=invalid_user');
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).redirect('/?error=token_error');
  }
};

module.exports = { protect };
