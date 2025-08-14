require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;
mongoose.set('strictQuery', true); // optional

async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✔ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('✖ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

start();

app.get('/health', (req, res) => {
  const state = ['disconnected','connected','connecting','disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.json({ dbState: state });
});

app.use('/api/apartments', require('./routes/apartments'));