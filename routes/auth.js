const express = require('express');
const User = require('../models/user'); // Import the User model
const router = express.Router();

// Route to register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if a user with the provided email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user object with the provided name, email, and password
    const user = new User({
      name,
      email,
      password, // The password will be hashed by the User model before saving
    });

    // Save the new user in the database
    await user.save();
    console.log('User registered successfully with email:', email);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to login a user using session
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by their email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password stored in the database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Store user data in the session
    req.session.user = {
      userId: user._id,
      email: user.email,
      name: user.name
    };

    console.log('User logged in successfully with email:', email);
    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to log out the user and destroy session
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid'); // Clear session cookie
    console.log('User logged out successfully');
    res.json({ message: 'Logout successful' });
  });
});

// Route to check if the user is logged in
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = router;
