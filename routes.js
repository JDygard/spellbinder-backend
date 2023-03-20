const express = require('express');
const passport = require('passport'); // Updated this import
const jwt = require('jsonwebtoken'); // Add this import
const { createUser } = require('./dynamo-db.js'); // Add this import

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const userData = {
            username: req.body.username,
            password: req.body.password, // Hash the password before saving it
        };
        const newUser = await createUser(userData);
        res.status(201).send(newUser);
    } catch (error) {
        console.error('Error during registration:', error); // Add this line
        res.status(500).send({ error: error.message });
    }
});

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, 'your_jwt_secret', {
      expiresIn: '1h',
    });
    const userToSend = {
        id: req.user.id,
        username: req.user.username,
        // Add any other non-sensitive user data you want to send
    };

    res.send({ token, user: userToSend });
  });

module.exports = router;
