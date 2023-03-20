const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const routes = require('./routes');
const { createUser } = require('./dynamo-db');
const { passport, authenticateSocket } = require('./auth');

const PORT = 3001;

const app = express();
const corsOptions = {
  origin: 'http://localhost:3000', // Replace this with your frontend URL
  methods: ['GET', 'POST'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/', routes);

app.use(passport.initialize());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000', // update this to frontend url in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


const setupSocket = require('./sockets');
setupSocket(io, authenticateSocket);

app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  res.status(500).send({ error: error.message });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
