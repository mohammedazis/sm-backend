// Session middleware configuration
const MongoStore = require('connect-mongo');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import routes
const productRoutes = require('./routes/product.route');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/productStock');
const purchaseRoutes = require('./routes/purchase');
const purchaseReturnRoutes = require('./routes/purchaseReturn');
const saleRoutes = require('./routes/sale');
const saleReturnRoutes = require('./routes/saleReturn');
const saleReturnDamageRoutes = require('./routes/damageReturn');

const app = express();
const PORT = process.env.PORT || 3001; // Port from environment or default

// MongoDB Connection URI from environment variables
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://azisvvm:azisvvm@cluster0.zbdana6.mongodb.net/stockManagement';

// Connect to MongoDB
mongoose.connect(MONGO_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json());

app.use(cors({
  origin: 'http://localhost:3000', // The address of your frontend
  credentials: true // Allow cookies to be sent along with requests
}));

app.use(cookieParser());

// Use environment variables for sensitive information
const sessionSecret = process.env.SESSION_SECRET || 'your-session-secret'; // Make sure to set this in production

// Session configuration
app.use(session({
  secret: sessionSecret, // Secret key for signing the session ID cookie
  resave: false, // Don't save session if it wasn't modified
  saveUninitialized: false, // Don't create session until something is stored
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost/sessiondb', // MongoDB URL for session store
    ttl: 24 * 60 * 60 // 1 day (in seconds)
  }),
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour session lifespan (in milliseconds)
    secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS-only cookies
    httpOnly: true, // Prevent client-side access to the cookie
    sameSite: 'lax' // Prevent CSRF by limiting cross-site requests
  }
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next(); // Proceed to the next middleware or route handler
  } else {
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
};

// Test route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Authentication route (For login simulation)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Dummy authentication logic (Replace with real validation logic)
  if (username === 'test' && password === 'password') {
    req.session.user = { username }; // Store user info in session
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Protected route
app.get('/protected', isAuthenticated, (req, res) => {
  res.json({ message: `Hello ${req.session.user.username}, this is a protected route!` });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

// Protect product routes with authentication middleware
app.use('/products', isAuthenticated, productRoutes);
app.use('/api/auth', authRoutes);
app.use('/product-stock', stockRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/purchase-return', purchaseReturnRoutes);
app.use('/sale', saleRoutes);
app.use('/sale-return', saleReturnRoutes);
app.use('/return-damage', saleReturnDamageRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An internal server error occurred' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
