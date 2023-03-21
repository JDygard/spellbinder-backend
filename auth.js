const jwt = require('jsonwebtoken');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { getUserByUsername, validatePassword } = require('./dynamo-db');
const dotenv = require('dotenv');
dotenv.config();

const {
  JWT_SECRET,
} = process.env;

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isPasswordCorrect = await validatePassword(user, password);
      if (!isPasswordCorrect) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const authenticateSocket = (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    console.log(socket.handshake.query.token)
    jwt.verify(socket.handshake.query.token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('Socket authentication error:', err); // Log the error
        return next(new Error('Authentication error'));
      }
      socket.user = decoded;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
};

module.exports = { passport, authenticateJWT, authenticateSocket };
