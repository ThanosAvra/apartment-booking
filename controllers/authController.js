// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const JWT_ISSUER = 'your-app';
const JWT_AUDIENCE = 'your-app-users';
const JWT_EXPIRES_IN = '8h';
const JWT_ALG = 'HS256';

const signToken = (userId, role) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Server misconfiguration: weak or missing JWT_SECRET');
  }
  return jwt.sign(
    { sub: userId.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: JWT_ISSUER, audience: JWT_AUDIENCE, algorithm: JWT_ALG }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email και password είναι υποχρεωτικά.' });
    }

    const emailNorm = String(email).toLowerCase().trim();

    // Optional: basic password policy
    if (password.length < 8) {
      return res.status(400).json({ error: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.' });
    }

    // Check for existing user (πέρα από unique index)
    const exists = await User.findOne({ email: emailNorm }).lean();
    if (exists) {
      return res.status(409).json({ error: 'Το email χρησιμοποιείται ήδη.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: emailNorm, passwordHash });

    return res.status(201).json({ message: 'User registered', userId: user._id });
  } catch (err) {
    // Handle duplicate key (αν βασίζεσαι στο unique index)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Το email χρησιμοποιείται ήδη.' });
    }
    return res.status(500).json({ error: 'Κάτι πήγε στραβά.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email και password είναι υποχρεωτικά.' });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      // Μην αποκαλύπτεις αν δεν υπάρχει
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user._id, user.role || 'user');
    return res.status(200).json({ message: 'Authenticated', token });
  } catch (err) {
    return res.status(500).json({ error: 'Κάτι πήγε στραβά.' });
  }
};