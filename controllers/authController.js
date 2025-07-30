const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Δημιουργία νέου χρήστη
    const user = new User({ name, email, passwordHash: password });
    await user.save();
    res.status(201).json({ message: 'User registered', userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Βρίσκουμε χρήστη με το email
    const user = await User.findOne({ email });
    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Δημιουργία JWT
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });
    res.json({ message: 'Authenticated', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};