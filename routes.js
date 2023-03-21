const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { createUser } = require('./dynamo-db.js');
const { authenticateJWT } = require('./auth.js');

const router = express.Router();

const dotenv = require('dotenv');
dotenv.config();

const {
  JWT_SECRET,
} = process.env;

router.post('/register', async (req, res) => {
  try {
    const userData = {
      username: req.body.username,
      password: req.body.password, // Hash the password before saving it
    };
    const newUser = await createUser(userData);
    res.status(201).send(newUser);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send({ error: error.message });
  }
});

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  const accessToken = jwt.sign({ id: req.user.id }, JWT_SECRET, {
    expiresIn: '1s',
  });

  const refreshToken = jwt.sign({ id: req.user.id }, JWT_SECRET, {
    expiresIn: '7d', // Modify the expiration time as needed
  });

  const userToSend = {
    id: req.user.id,
    username: req.user.username,
    // Add any other non-sensitive user data you want to send
  };

  res.send({ accessToken, refreshToken, user: userToSend });
});

router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '7d', // Modify the expiration time as needed
    });
    res.json({ accessToken, refreshToken });
  });
});

router.get('/verify-token', authenticateJWT, (req, res) => {
  res.status(200).send({ message: 'Token is valid' });
});

module.exports = router;
