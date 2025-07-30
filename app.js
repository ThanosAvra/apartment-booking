require('dotenv').config();
console.log('MONGO_URI =', process.env.MONGO_URI);
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
// (άλλες routes θα μπουν παρακάτω)

const app = express();
app.use(express.json());

// MongoDB σύνδεση
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
})
.then(() => console.log('✔ MongoDB connected'))
.catch(err => console.error('✖ MongoDB error:', err));

// Auth endpoints (public)
app.use('/api/auth', authRoutes);

// Παράδειγμα προστατευμένου route
app.get('/api/profile', authMiddleware, async (req, res) => {
  // req.user.id περιέχει το ObjectId του χρήστη
  const user = await require('./models/user').findById(req.user.id);
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

// Health check
app.get('/', (req, res) => res.send('Server is running!'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));