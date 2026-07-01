const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!db) {
      return res.status(400).json({ error: 'Database not initialized. Please setup Firebase credentials.' });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      createdAt: new Date(),
      subscription: 'free',
      robots: [],
      credits: 100
    });

    res.json({ uid: userRecord.uid, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Use Firebase client SDK on frontend for secure login
    res.json({ message: 'Use Firebase client SDK for authentication' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
